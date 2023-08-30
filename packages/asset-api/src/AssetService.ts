import { AssetChangeEvent } from '@guanghechen/asset-types'
import type {
  IAssetDataMap,
  IAssetResolver,
  IAssetResolverApi,
  IAssetService,
  IAssetServiceConfig,
  IAssetServiceWatcher,
  IAssetTaskData,
  IAssetWatcher,
} from '@guanghechen/asset-types'
import { delay } from '@guanghechen/asset-util'
import type { IReporter, IScheduler } from '@guanghechen/scheduler'
import { AssetTaskScheduler } from './AssetTaskScheduler'

export interface IAssetServiceProps {
  resolver: IAssetResolver
  reporter: IReporter
  delayAfterContentChanged?: number // Wait a few million seconds after file content changed.
}

export class AssetService implements IAssetService {
  protected readonly _resolver: IAssetResolver
  protected readonly _reporter: IReporter
  protected readonly _delayAfterContentChanged: number

  constructor(props: IAssetServiceProps) {
    this._resolver = props.resolver
    this._reporter = props.reporter
    this._delayAfterContentChanged = Number.isNaN(props.delayAfterContentChanged)
      ? 200
      : Number(props.delayAfterContentChanged)
  }

  public async build(configs: IAssetServiceConfig[]): Promise<void> {
    const resolver = this._resolver
    for (const { api, sourceStorage, acceptedPattern } of configs) {
      const locations = await sourceStorage.collectAssetLocations(acceptedPattern, {
        absolute: true,
      })
      await resolver.create(api, locations)
      await this.dumpAssetDataMap(api)
    }
  }

  public async watch(configs: IAssetServiceConfig[]): Promise<IAssetServiceWatcher> {
    const { _resolver, _reporter, _delayAfterContentChanged } = this
    const schedulers: Array<IScheduler<IAssetTaskData>> = []
    const watchers: IAssetWatcher[] = []

    for (const { api, sourceStorage, acceptedPattern } of configs) {
      const scheduler = new AssetTaskScheduler({
        api,
        resolver: _resolver,
        reporter: _reporter,
        delayAfterContentChanged: _delayAfterContentChanged,
      })
      schedulers.push(scheduler)

      const watcher = sourceStorage.watch(acceptedPattern, {
        onAdd: filepath => {
          scheduler.schedule({
            type: AssetChangeEvent.CREATED,
            alive: true,
            payload: { location: filepath },
          })
        },
        onChange: filepath => {
          scheduler.schedule({
            type: AssetChangeEvent.MODIFIED,
            alive: true,
            payload: { location: filepath },
          })
        },
        onUnlink: filepath => {
          scheduler.schedule({
            type: AssetChangeEvent.REMOVED,
            alive: true,
            payload: { location: filepath },
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

  protected async dumpAssetDataMap(api: IAssetResolverApi): Promise<void> {
    const assetDataMap: IAssetDataMap = this._resolver.dump()
    await api.saveAssetDataMap(assetDataMap)
  }
}
