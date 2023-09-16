import { AssetChangeEventEnum } from '@guanghechen/asset-types'
import type {
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
    const scheduler = this._scheduler
    if (scheduler.terminated) return
    await scheduler.start()
  }

  public async close(): Promise<void> {
    if (this._status !== 'prepared') return

    this._status = 'closed'
    const scheduler = this._scheduler
    if (scheduler.terminated) return

    const watchers = this._watchers.slice()
    this._watchers.length = 0
    await Promise.all(watchers.map(watcher => watcher.unwatch()))

    await scheduler.finish()
    scheduler.cleanup()
  }

  public async build(acceptedPattern: ReadonlyArray<string>): Promise<void> {
    if (this._status !== 'prepared') {
      throw new Error(`AssetService is not running`)
    }

    const { _scheduler, _sourceStorage } = this
    const srcPaths: string[] = await _sourceStorage.collect(acceptedPattern.slice(), {
      absolute: true,
    })
    const code: number = await _scheduler.schedule({
      type: AssetChangeEventEnum.MODIFIED,
      filepaths: srcPaths,
    })

    this._reporter.verbose(
      `[AssetService] waiting finish:`,
      _sourceStorage.pathResolver.rootDir,
      acceptedPattern,
    )
    await _scheduler.waitTaskTerminated(code)
    this._reporter.verbose(`[AssetService] finished:`, _sourceStorage.pathResolver.rootDir)
  }

  // In watching mode, use scheduler to schedule tasks.
  public async watch(
    acceptedPattern: ReadonlyArray<string>,
    shouldIgnore?: IAssetWatchShouldIgnore,
  ): Promise<IAssetServiceWatcher> {
    if (this._status !== 'prepared') {
      throw new Error(`AssetService is not running`)
    }

    const { _scheduler, _sourceStorage } = this
    const watcher: IAssetWatcher = _sourceStorage.watch(acceptedPattern.slice(), {
      onAdd: filepath => {
        const srcPath: string = _sourceStorage.pathResolver.absolute(filepath)
        void _scheduler.schedule({ type: AssetChangeEventEnum.CREATED, filepaths: [srcPath] })
      },
      onChange: filepath => {
        const srcPath: string = _sourceStorage.pathResolver.absolute(filepath)
        void _scheduler.schedule({ type: AssetChangeEventEnum.MODIFIED, filepaths: [srcPath] })
      },
      onRemove: filepath => {
        const srcPath: string = _sourceStorage.pathResolver.absolute(filepath)
        void _scheduler.schedule({ type: AssetChangeEventEnum.REMOVED, filepaths: [srcPath] })
      },
      shouldIgnore,
    })

    // delay 500ms
    await new Promise<void>(resolve => setTimeout(resolve, 500))

    let unWatching = false
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
