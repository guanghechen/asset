import { AssetChangeEvent } from '@guanghechen/asset-types'
import type {
  IAssetDataMap,
  IAssetResolver,
  IAssetResolverApi,
  IAssetService,
  IAssetServiceConfig,
  IAssetServiceWatcher,
} from '@guanghechen/asset-types'
import { delay } from '@guanghechen/asset-util'

export interface IAssetServiceProps {
  resolver: IAssetResolver
}

export class AssetService implements IAssetService {
  protected readonly _resolver: IAssetResolver

  constructor(props: IAssetServiceProps) {
    this._resolver = props.resolver
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
    for (const { sourceStorage, scheduler, acceptedPattern } of configs) {
      sourceStorage.watch(acceptedPattern, {
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
    }

    await delay(500)
    await Promise.allSettled(configs.map(config => config.scheduler.start()))

    return {
      unwatch: async (): Promise<void> => {
        await Promise.allSettled(
          configs.map(config => config.scheduler.finish().then(() => config.scheduler.cleanup())),
        )
      },
    }
  }

  protected async dumpAssetDataMap(api: IAssetResolverApi): Promise<void> {
    const assetDataMap: IAssetDataMap = this._resolver.dump()
    await api.saveAssetDataMap(assetDataMap)
  }
}
