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
    const type: AssetChangeEventEnum = this._type
    const filepaths: string[] = this._filepaths
    return { type, filepaths }
  }

  protected override async run(): Promise<void> {
    const api: IAssetTaskApi = this._api
    const type: AssetChangeEventEnum = this._type
    const filepaths: string[] = this._filepaths
    switch (type) {
      case AssetChangeEventEnum.CREATED:
        await api.create(filepaths)
        break
      case AssetChangeEventEnum.REMOVED:
        await api.remove(filepaths)
        break
      case AssetChangeEventEnum.MODIFIED:
        await api.update(filepaths)
        break
      default: {
        const details = JSON.stringify({ type, filepaths })
        throw new Error(`[AssetTask] handleTask: unknown task: ${details}`)
      }
    }
  }
}
