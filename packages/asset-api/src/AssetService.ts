import { AssetChangeEventEnum } from '@guanghechen/asset-types'
import type {
  IAssetService,
  IAssetServiceConfig,
  IAssetServiceWatcher,
  IAssetTaskData,
  IAssetWatcher,
} from '@guanghechen/asset-types'
import { delay } from '@guanghechen/asset-util'
import type { IReporter, IScheduler } from '@guanghechen/types'
import { AssetTaskScheduler } from './AssetTaskScheduler'

export interface IAssetServiceProps {
  reporter: IReporter
}

export class AssetService implements IAssetService {
  protected readonly _reporter: IReporter

  constructor(props: IAssetServiceProps) {
    this._reporter = props.reporter
  }

  public async build(configs: Iterable<IAssetServiceConfig>): Promise<void> {
    for (const { api, sourceStorage, acceptedPattern } of configs) {
      const srcPaths = await sourceStorage.collectAssetSrcPaths(acceptedPattern, {
        absolute: true,
      })
      await api.create(srcPaths)
    }
  }

  public async watch(configs: Iterable<IAssetServiceConfig>): Promise<IAssetServiceWatcher> {
    const reporter = this._reporter
    const schedulers: Array<IScheduler<IAssetTaskData>> = []
    const watchers: IAssetWatcher[] = []
    for (const { api, sourceStorage, acceptedPattern } of configs) {
      const scheduler = new AssetTaskScheduler({ api, reporter })
      schedulers.push(scheduler)

      const watcher = sourceStorage.watch(acceptedPattern, {
        onAdd: filepath => {
          const srcPath: string = sourceStorage.pathResolver.absolute(filepath)
          void scheduler.schedule({
            type: AssetChangeEventEnum.CREATED,
            alive: true,
            srcPath,
          })
        },
        onChange: filepath => {
          const srcPath: string = sourceStorage.pathResolver.absolute(filepath)
          void scheduler.schedule({
            type: AssetChangeEventEnum.MODIFIED,
            alive: true,
            srcPath,
          })
        },
        onRemove: filepath => {
          const srcPath: string = sourceStorage.pathResolver.absolute(filepath)
          void scheduler.schedule({
            type: AssetChangeEventEnum.REMOVED,
            alive: true,
            srcPath,
          })
        },
      })
      watchers.push(watcher)
    }

    await delay(500)
    await Promise.allSettled(schedulers.map(scheduler => scheduler.start()))

    let unWatching = false
    return {
      unwatch: async (): Promise<void> => {
        if (unWatching) return
        unWatching = true

        await Promise.allSettled(watchers.map(watcher => watcher.unwatch()))
        await Promise.allSettled(
          schedulers.map(scheduler => scheduler.finish().then(() => scheduler.cleanup())),
        )
      },
    }
  }
}
