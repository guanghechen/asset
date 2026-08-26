import { AssetChangeEventEnum } from '@guanghechen/asset-types'
import type {
  IAsset,
  IAssetPathResolver,
  IAssetResolver,
  IAssetResolverApi,
  IAssetService,
  IAssetServiceWatcher,
  IAssetSourceStorage,
  IAssetTargetStorage,
  IAssetTaskApi,
  IAssetWatchShouldIgnore,
  IAssetWatcher,
} from '@guanghechen/asset-types'
import type { IReporter } from '@guanghechen/reporter'
import { AssetDataConsumer } from './AssetDataConsumer'
import { AssetTaskApi } from './AssetTaskApi'
import { AssetTaskScheduler } from './AssetTaskScheduler'
import type { IAssetTaskScheduler } from './AssetTaskScheduler'

interface IProps {
  reporter: IReporter
  resolver: IAssetResolver
  resolverApi: IAssetResolverApi
  pathResolver: IAssetPathResolver
  sourceStorage: IAssetSourceStorage
  targetStorage: IAssetTargetStorage
  dataMapUri: string
}

export class AssetService implements IAssetService {
  public readonly dataMapUri: string
  public readonly pathResolver: IAssetPathResolver
  protected readonly _taskApi: IAssetTaskApi
  protected readonly _resolverApi: IAssetResolverApi
  protected readonly _reporter: IReporter
  protected readonly _sourceStorage: IAssetSourceStorage
  protected readonly _scheduler: IAssetTaskScheduler
  protected readonly _watchers: IAssetServiceWatcher[]
  protected _status: 'pending' | 'prepared' | 'closed'

  constructor(props: IProps) {
    const {
      reporter,
      resolver,
      resolverApi,
      pathResolver,
      sourceStorage,
      targetStorage,
      dataMapUri,
    } = props
    const taskApi = new AssetTaskApi({
      resolverApi,
      resolver,
      reporter,
      targetStorage,
      dataMapUri,
    })
    const scheduler: IAssetTaskScheduler = new AssetTaskScheduler(reporter)
      //
      .use(new AssetDataConsumer('asset-consumer', taskApi))

    this.pathResolver = pathResolver
    this.dataMapUri = dataMapUri
    this._taskApi = taskApi
    this._resolverApi = resolverApi
    this._reporter = reporter
    this._sourceStorage = sourceStorage
    this._scheduler = scheduler
    this._watchers = []
    this._status = 'pending'
  }

  public async prepare(): Promise<void> {
    if (this._status !== 'pending') return
    this._status = 'prepared'

    const scheduler: IAssetTaskScheduler = this._scheduler
    if (scheduler.status.terminated) return

    await scheduler.start()
  }

  public async close(): Promise<void> {
    if (this._status !== 'prepared') return
    this._status = 'closed'

    const scheduler: IAssetTaskScheduler = this._scheduler
    if (scheduler.status.terminated) return

    const watchers: IAssetServiceWatcher[] = this._watchers.slice()
    this._watchers.length = 0
    await Promise.all(watchers.map(watcher => watcher.unwatch()))
    await scheduler.complete()
  }

  public async buildByPaths(absoluteSrcPaths: ReadonlyArray<string>): Promise<void> {
    if (this._status !== 'prepared') {
      throw new Error('[AssetService.buildByPaths] service is not running')
    }

    if (absoluteSrcPaths.length <= 0) return

    const reporter: IReporter = this._reporter
    const scheduler: IAssetTaskScheduler = this._scheduler
    const pathResolver: IAssetPathResolver = this.pathResolver

    for (const absoluteSrcPath of absoluteSrcPaths) {
      pathResolver.assertSafeAbsolutePath(absoluteSrcPath)
    }

    // waitTaskTerminated() only waits for completion; task failures are stored on the scheduler.
    const errorOffset: number = scheduler.errors.length
    const code: number = await scheduler.schedule({
      type: AssetChangeEventEnum.MODIFIED,
      absoluteSrcPaths: absoluteSrcPaths,
    })
    if (code < 0) throw new Error('[AssetService.buildByPaths] scheduler rejected the build')

    reporter.debug('[AssetService.buildByPaths] building. absoluteSrcPaths:', absoluteSrcPaths)
    await scheduler.waitTaskTerminated(code)
    if (scheduler.errors.length > errorOffset) {
      throw new AggregateError(
        scheduler.errors.slice(errorOffset),
        '[AssetService.buildByPaths] build failed',
      )
    }
    reporter.debug('[AssetService.buildByPaths] finished. absoluteSrcPaths:', absoluteSrcPaths)
  }

  public async buildByPatterns(
    cwd: string,
    acceptedPathPatterns: ReadonlyArray<RegExp>,
  ): Promise<void> {
    if (this._status !== 'prepared') {
      throw new Error(`[AssetService.buildByPatterns] service is ${this._status}.`)
    }

    const pathResolver: IAssetPathResolver = this.pathResolver
    const sourceStorage: IAssetSourceStorage = this._sourceStorage

    // Ensure the cwd is a safe absolute filepath.
    pathResolver.assertSafeAbsolutePath(cwd)

    const absoluteSrcPaths: string[] = await sourceStorage.collect(acceptedPathPatterns, { cwd })
    await this.buildByPaths(absoluteSrcPaths)
  }

  public async findAsset(predicate: (asset: Readonly<IAsset>) => boolean): Promise<IAsset | null> {
    return this._resolverApi.locator.findAsset(predicate)
  }

  public async findSrcPathByUri(uri: string): Promise<string | null> {
    return this._resolverApi.locator.findSrcPathByUri(uri)
  }

  public async resolveAsset(absoluteSrcPath: string): Promise<IAsset | null> {
    return this._taskApi.resolve(absoluteSrcPath)
  }

  // In watching mode, use scheduler to schedule tasks.
  public async watch(
    cwd: string,
    acceptedPathPatterns: ReadonlyArray<RegExp>,
    shouldIgnore?: IAssetWatchShouldIgnore,
  ): Promise<IAssetServiceWatcher> {
    if (this._status !== 'prepared') {
      throw new Error('AssetService is not running')
    }

    const pathResolver: IAssetPathResolver = this.pathResolver

    // Ensure the cwd is a safe absolute filepath.
    pathResolver.assertSafeAbsolutePath(cwd)

    if (acceptedPathPatterns.length === 0) {
      return { unwatch: async (): Promise<void> => undefined }
    }

    const scheduler: IAssetTaskScheduler = this._scheduler
    const watcher: IAssetWatcher = this._sourceStorage.watch(acceptedPathPatterns, {
      cwd,
      onAdd: filepath => {
        const srcPath: string = pathResolver.absolute(cwd, filepath)
        void scheduler.schedule({ type: AssetChangeEventEnum.CREATED, absoluteSrcPaths: [srcPath] })
      },
      onChange: filepath => {
        const srcPath: string = pathResolver.absolute(cwd, filepath)
        void scheduler.schedule({
          type: AssetChangeEventEnum.MODIFIED,
          absoluteSrcPaths: [srcPath],
        })
      },
      onRemove: filepath => {
        const srcPath: string = pathResolver.absolute(cwd, filepath)
        void scheduler.schedule({ type: AssetChangeEventEnum.REMOVED, absoluteSrcPaths: [srcPath] })
      },
      shouldIgnore,
    })

    let unWatching = false
    const serviceWatcher: IAssetServiceWatcher = {
      unwatch: async (): Promise<void> => {
        if (unWatching) return
        unWatching = true

        await watcher.unwatch()
      },
    }

    // Register before the readiness delay so close() cannot miss an active watcher.
    this._watchers.push(serviceWatcher)

    // delay 500ms
    await new Promise<void>(resolve => setTimeout(resolve, 500))
    return serviceWatcher
  }
}
