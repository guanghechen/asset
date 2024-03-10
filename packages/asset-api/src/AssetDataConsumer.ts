import type { IAssetTaskApi, IAssetTaskData } from '@guanghechen/asset-types'
import type {
  IProductConsumer,
  IProductConsumerApi,
  IProductConsumerNext,
} from '@guanghechen/scheduler'
import type { ITask } from '@guanghechen/task'
import { AssetTask } from './AssetTask'

type D = IAssetTaskData
type T = ITask

export class AssetDataConsumer implements IProductConsumer<D, T> {
  public readonly name: string
  protected readonly _api: IAssetTaskApi

  constructor(name: string, api: IAssetTaskApi) {
    this.name = name
    this._api = api
  }

  public async consume(
    data: D,
    embryo: ITask | null,
    _api: IProductConsumerApi,
    next: IProductConsumerNext<ITask>,
  ): Promise<ITask | null> {
    if (embryo !== null) return next(embryo)
    const task: T = new AssetTask(this._api, data.type, data.absoluteSrcPaths)
    return next(task)
  }
}
