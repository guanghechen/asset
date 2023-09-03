import { AssetChangeEvent } from '@guanghechen/asset-types'
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
      const locations = await sourceStorage.collectAssetLocations(acceptedPattern, {
        absolute: true,
      })
      await api.create(locations)

      // dump asset data map
      await api.saveAssetDataMap()
    }
  }

  public async watch(configs: Iterable<IAssetServiceConfig>): Promise<IAssetServiceWatcher> {
    const schedulers: Array<IScheduler<IAssetTaskData>> = []
    const watchers: IAssetWatcher[] = []
    for (const { api, sourceStorage, acceptedPattern } of configs) {
      const scheduler = new AssetTaskScheduler({ api, reporter: this._reporter })
      schedulers.push(scheduler)

      const watcher = sourceStorage.watch(acceptedPattern, {
        onAdd: filepath => {
          void scheduler.schedule({
            type: AssetChangeEvent.CREATED,
            alive: true,
            location: filepath,
          })
        },
        onChange: filepath => {
          void scheduler.schedule({
            type: AssetChangeEvent.MODIFIED,
            alive: true,
            location: filepath,
          })
        },
        onUnlink: filepath => {
          void scheduler.schedule({
            type: AssetChangeEvent.REMOVED,
            alive: true,
            location: filepath,
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
