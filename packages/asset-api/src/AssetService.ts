import { AssetChangeEventEnum } from '@guanghechen/asset-types'
import type {
  IAssetPathResolver,
  IAssetService,
  IAssetServiceWatcher,
  IAssetSourceStorage,
  IAssetTaskApi,
  IAssetWatchShouldIgnore,
  IAssetWatcher,
} from '@guanghechen/asset-types'
import type { IReporter } from '@guanghechen/types'
import { AssetTaskScheduler } from './AssetTaskScheduler'
import type { IAssetTaskScheduler } from './types'

interface IProps {
  api: IAssetTaskApi
  reporter: IReporter
  sourceStorage: IAssetSourceStorage
}

export class AssetService implements IAssetService {
  protected readonly _api: IAssetTaskApi
  protected readonly _reporter: IReporter
  protected readonly _sourceStorage: IAssetSourceStorage
  protected readonly _scheduler: IAssetTaskScheduler
  protected readonly _watchers: IAssetServiceWatcher[]
  protected _status: 'pending' | 'prepared' | 'closed'

  constructor(props: IProps) {
    const { api, reporter, sourceStorage } = props
    const scheduler: IAssetTaskScheduler = new AssetTaskScheduler(api, reporter)

    this._api = api
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
    if (scheduler.terminated) return

    await scheduler.start()
  }

  public async close(): Promise<void> {
    if (this._status !== 'prepared') return
    this._status = 'closed'

    const scheduler: IAssetTaskScheduler = this._scheduler
    if (scheduler.terminated) return

    const watchers: IAssetServiceWatcher[] = this._watchers.slice()
    this._watchers.length = 0
    await Promise.all(watchers.map(watcher => watcher.unwatch()))

    await scheduler.finish()
    scheduler.cleanup()
  }

  public async buildByPaths(filepaths_: ReadonlyArray<string>): Promise<void> {
    if (this._status !== 'prepared') {
      throw new Error('[AssetService.buildByPaths] service is not running')
    }

    if (filepaths_.length <= 0) return

    const scheduler: IAssetTaskScheduler = this._scheduler
    const pathResolver: IAssetPathResolver = this._sourceStorage.pathResolver
    const filepaths: string[] = filepaths_.map(filepath => pathResolver.absolute(filepath))
    const code: number = await scheduler.schedule({
      type: AssetChangeEventEnum.MODIFIED,
      filepaths,
    })

    this._reporter.debug('[AssetService.buildByPaths] waiting finish:', pathResolver.rootDir, () =>
      filepaths.map(filepath => pathResolver.relative(filepath)),
    )
    await scheduler.waitTaskTerminated(code)
    this._reporter.verbose(`[AssetService.buildByPaths] finished:`, pathResolver.rootDir)
  }

  public async buildByPatterns(acceptedPattern: ReadonlyArray<string>): Promise<void> {
    if (this._status !== 'prepared') {
      throw new Error('[AssetService.buildByPatterns] service is not running')
    }

    const srcPaths: string[] = await this._sourceStorage.collect(acceptedPattern.slice(), {
      absolute: true,
    })
    await this.buildByPaths(srcPaths)
  }

  // In watching mode, use scheduler to schedule tasks.
  public async watch(
    acceptedPattern: ReadonlyArray<string>,
    shouldIgnore?: IAssetWatchShouldIgnore,
  ): Promise<IAssetServiceWatcher> {
    if (this._status !== 'prepared') {
      throw new Error(`AssetService is not running`)
    }

    const scheduler: IAssetTaskScheduler = this._scheduler
    const pathResolver: IAssetPathResolver = this._sourceStorage.pathResolver
    const watcher: IAssetWatcher = this._sourceStorage.watch(acceptedPattern.slice(), {
      onAdd: filepath => {
        const srcPath: string = pathResolver.absolute(filepath)
        void scheduler.schedule({ type: AssetChangeEventEnum.CREATED, filepaths: [srcPath] })
      },
      onChange: filepath => {
        const srcPath: string = pathResolver.absolute(filepath)
        void scheduler.schedule({ type: AssetChangeEventEnum.MODIFIED, filepaths: [srcPath] })
      },
      onRemove: filepath => {
        const srcPath: string = pathResolver.absolute(filepath)
        void scheduler.schedule({ type: AssetChangeEventEnum.REMOVED, filepaths: [srcPath] })
      },
      shouldIgnore,
    })

    // delay 500ms
    await new Promise<void>(resolve => setTimeout(resolve, 500))

    let unWatching: boolean = false
    const serviceWatcher: IAssetServiceWatcher = {
      unwatch: async (): Promise<void> => {
        if (unWatching) return
        unWatching = true

        await watcher.unwatch()
      },
    }
    this._watchers.push(serviceWatcher)
    return serviceWatcher
  }
}
