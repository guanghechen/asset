import { AssetChangeEventEnum } from '@guanghechen/asset-types'
import type { IAssetTaskApi } from '@guanghechen/asset-types'
import { AtomicTask } from '@guanghechen/task'

export class AssetTask extends AtomicTask {
  protected readonly _api: IAssetTaskApi
  protected readonly _type: AssetChangeEventEnum
  protected readonly _filepaths: string[]

  constructor(api: IAssetTaskApi, type: AssetChangeEventEnum, filepaths: string[]) {
    super(type)
    this._api = api
    this._type = type
    this._filepaths = filepaths
  }

  public toJSON(): object {
    const { _type, _filepaths } = this
    return { type: _type, filepaths: _filepaths }
  }

  protected override async run(): Promise<void> {
    const { _api, _type, _filepaths } = this
    switch (_type) {
      case AssetChangeEventEnum.CREATED:
        await _api.create(_filepaths)
        break
      case AssetChangeEventEnum.REMOVED:
        await _api.remove(_filepaths)
        break
      case AssetChangeEventEnum.MODIFIED:
        await _api.update(_filepaths)
        break
      default: {
        const details = JSON.stringify({ type: _type, filepaths: _filepaths })
        throw new Error(`[AssetTask] handleTask: unknown task: ${details}`)
      }
    }
  }
}
