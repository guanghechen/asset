import type { AssetChangeEventEnum, IAssetTaskApi, IAssetTaskData } from '@guanghechen/asset-types'
import { Pipeline } from '@guanghechen/pipeline'
import type { IPipelineMaterial, ITask } from '@guanghechen/types'
import { AssetTask } from './AssetTask'
import type { IAssetTaskPipeline } from './types'

type D = IAssetTaskData
type T = ITask

export class AssetTaskPipeline extends Pipeline<D, T> implements IAssetTaskPipeline {
  protected readonly _api: IAssetTaskApi

  constructor(api: IAssetTaskApi) {
    super()
    this._api = api
  }

  public override async push(input: D): Promise<number> {
    const absoluteSrcPaths: string[] = input.absoluteSrcPaths.slice()
    if (absoluteSrcPaths.length <= 0) return -1

    const data: D = { type: input.type, absoluteSrcPaths }
    return super.push(data)
  }

  protected override async cook(material: IPipelineMaterial<D>): Promise<T | undefined> {
    if (!material.alive) return undefined

    const type: AssetChangeEventEnum = material.data.type
    const absoluteSrcPathSet: Set<string> = new Set(material.data.absoluteSrcPaths)
    const others: ReadonlyArray<IPipelineMaterial<D>> = this._materials
    for (const otherMaterial of others) {
      if (!otherMaterial.alive) continue
      if (otherMaterial.data.type !== type) break

      otherMaterial.alive = false
      for (const filepath of otherMaterial.data.absoluteSrcPaths) absoluteSrcPathSet.add(filepath)
    }

    if (absoluteSrcPathSet.size <= 0) return undefined

    const absoluteSrcPaths: string[] = Array.from(absoluteSrcPathSet)
    absoluteSrcPathSet.clear()
    return new AssetTask(this._api, type, absoluteSrcPaths)
  }
}
