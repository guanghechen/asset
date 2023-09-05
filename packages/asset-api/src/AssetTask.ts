import { AssetChangeEvent } from '@guanghechen/asset-types'
import type { IAssetTaskApi, IAssetTaskData } from '@guanghechen/asset-types'
import { delay } from '@guanghechen/asset-util'
import { AtomicTask } from '@guanghechen/task'

interface IProps {
  api: IAssetTaskApi
  data: Readonly<IAssetTaskData> // should be immutable
}

export class AssetTask extends AtomicTask {
  protected readonly _api: IAssetTaskApi
  protected readonly _data: Readonly<IAssetTaskData>

  constructor(props: IProps) {
    super(props.data.type)
    this._api = props.api
    this._data = props.data
  }

  protected override async run(): Promise<void> {
    const { _api, _data } = this
    switch (_data.type) {
      case AssetChangeEvent.CREATED:
        await _api.create([_data.srcPath])
        break
      case AssetChangeEvent.REMOVED:
        await _api.remove([_data.srcPath])
        break
      case AssetChangeEvent.MODIFIED:
        await _api.update([_data.srcPath])
        await delay(_api.delayAfterContentChanged)
        break
      default: {
        const details = _data == null ? _data : JSON.stringify(_data)
        throw new Error(`[AssetService] handleTask: unknown task: ${details}`)
      }
    }
  }
}
