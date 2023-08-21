import { AssetChangeEvent } from '@guanghechen/asset-types'
import type {
  IAssetChangeTaskData,
  IAssetDataMap,
  IAssetResolver,
  IAssetResolverApi,
} from '@guanghechen/asset-types'
import { delay } from '@guanghechen/asset-util'
import { AtomicTask } from '@guanghechen/scheduler'

export interface IAssetChangeTaskProps {
  api: IAssetResolverApi
  resolver: IAssetResolver
  data: IAssetChangeTaskData
  delayAfterContentChanged: number
}

export class AssetChangeTask extends AtomicTask {
  protected readonly _api: IAssetResolverApi
  protected readonly _resolver: IAssetResolver
  protected readonly _delayAfterContentChanged: number
  protected readonly _data: IAssetChangeTaskData

  constructor(props: IAssetChangeTaskProps) {
    super()
    this._api = props.api
    this._resolver = props.resolver
    this._delayAfterContentChanged = props.delayAfterContentChanged
    this._data = {
      type: props.data.type,
      payload: {
        locations: props.data.payload.locations.map(location =>
          this._api.resolveSrcLocation(location),
        ),
      },
    }
  }

  protected override async _run(): Promise<void> {
    const { _api, _resolver, _data, _delayAfterContentChanged } = this
    switch (_data.type) {
      case AssetChangeEvent.CREATED:
        await _resolver.create(_api, _data.payload.locations)
        break
      case AssetChangeEvent.REMOVED:
        await _resolver.remove(_api, _data.payload.locations)
        break
      case AssetChangeEvent.MODIFIED:
        await _resolver.remove(_api, _data.payload.locations)
        await _resolver.create(_api, _data.payload.locations)
        await delay(_delayAfterContentChanged)
        break
      default: {
        const details = _data == null ? _data : JSON.stringify(_data)
        throw new Error(`[AssetService] handleTask: unknown task: ${details}`)
      }
    }
    const assetDataMap: IAssetDataMap = _resolver.dump()
    await _api.saveAssetDataMap(assetDataMap)
  }
}
