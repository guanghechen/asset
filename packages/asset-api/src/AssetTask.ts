import { AssetChangeEvent } from '@guanghechen/asset-types'
import type { IAssetDataMap, IAssetTaskData } from '@guanghechen/asset-types'
import { delay } from '@guanghechen/asset-util'
import { AtomicTask } from '@guanghechen/task'
import type { IAssetTaskContext } from './types'

interface IProps {
  ctx: IAssetTaskContext
  data: Readonly<IAssetTaskData> // should be immutable
}

export class AssetTask extends AtomicTask {
  protected readonly _ctx: IAssetTaskContext
  protected readonly _data: Readonly<IAssetTaskData>

  constructor(props: IProps) {
    const { ctx, data } = props
    super(data.type)

    this._ctx = ctx
    this._data = data
  }

  protected override async run(): Promise<void> {
    const { _ctx, _data } = this
    switch (_data.type) {
      case AssetChangeEvent.CREATED:
        await _ctx.resolver.create(_ctx.api, [_data.location])
        break
      case AssetChangeEvent.REMOVED:
        await _ctx.resolver.remove(_ctx.api, [_data.location])
        break
      case AssetChangeEvent.MODIFIED:
        await _ctx.resolver.update(_ctx.api, [_data.location])
        await delay(_ctx.delayAfterContentChanged)
        break
      default: {
        const details = _data == null ? _data : JSON.stringify(_data)
        throw new Error(`[AssetService] handleTask: unknown task: ${details}`)
      }
    }
    const assetDataMap: IAssetDataMap = await _ctx.resolver.dump()
    await _ctx.api.saveAssetDataMap(assetDataMap)
  }
}
