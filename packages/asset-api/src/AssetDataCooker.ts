import type { AssetChangeEventEnum, IAssetTaskData } from '@guanghechen/asset-types'
import type {
  IMaterialCooker,
  IMaterialCookerApi,
  IMaterialCookerNext,
} from '@guanghechen/scheduler'

type D = IAssetTaskData
type T = IAssetTaskData

export class AssetDataCooker implements IMaterialCooker<D, T> {
  public readonly name: string

  constructor(name: string) {
    this.name = name
  }

  public async cook(
    data: D,
    embryo: T | null,
    api: IMaterialCookerApi<D>,
    next: IMaterialCookerNext<T>,
  ): Promise<T | null> {
    if (embryo !== null) return next(embryo)

    const type: AssetChangeEventEnum = data.type
    const absoluteSrcPathSet: Set<string> = new Set(data.absoluteSrcPaths)
    for (const sibiling of api.subsequent()) {
      if (sibiling.data.type !== type) break
      api.invalidate(sibiling)
      for (const absoluteSrcPath of data.absoluteSrcPaths) absoluteSrcPathSet.add(absoluteSrcPath)
    }

    if (absoluteSrcPathSet.size <= 0) return next(embryo)

    const result: T = { type, absoluteSrcPaths: Array.from(absoluteSrcPathSet) }
    absoluteSrcPathSet.clear()
    return next(result)
  }
}
