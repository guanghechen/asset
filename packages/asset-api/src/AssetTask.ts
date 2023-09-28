import { AssetChangeEventEnum } from '@guanghechen/asset-types'
import type { IAssetTaskApi } from '@guanghechen/asset-types'
import { AtomicTask } from '@guanghechen/task'

export class AssetTask extends AtomicTask {
  protected readonly _api: IAssetTaskApi
  protected readonly _type: AssetChangeEventEnum
  protected readonly _absoluteSrcPaths: string[]

  constructor(
    api: IAssetTaskApi,
    type: AssetChangeEventEnum,
    absoluteSrcPaths: ReadonlyArray<string>,
  ) {
    super(type)
    this._api = api
    this._type = type
    this._absoluteSrcPaths = absoluteSrcPaths.slice()
  }

  public toJSON(): object {
    const type: AssetChangeEventEnum = this._type
    const absoluteSrcPaths: string[] = this._absoluteSrcPaths.slice()
    return { type, absoluteSrcPaths }
  }

  protected override async run(): Promise<void> {
    const api: IAssetTaskApi = this._api
    const type: AssetChangeEventEnum = this._type
    switch (type) {
      case AssetChangeEventEnum.CREATED:
        await api.create(this._absoluteSrcPaths)
        break
      case AssetChangeEventEnum.REMOVED:
        await api.remove(this._absoluteSrcPaths)
        break
      case AssetChangeEventEnum.MODIFIED:
        await api.update(this._absoluteSrcPaths)
        break
      default: {
        const details = JSON.stringify({ type, absoluteSrcPaths: this._absoluteSrcPaths })
        throw new Error(`[AssetTask] handleTask: unknown task: ${details}`)
      }
    }
  }
}
