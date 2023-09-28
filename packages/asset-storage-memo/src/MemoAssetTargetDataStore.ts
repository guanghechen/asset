import type { IAssetTargetDataStorage, IFileData, ITargetItem } from '@guanghechen/asset-types'

export class MemoAssetTargetDataStore implements IAssetTargetDataStorage {
  protected _dataCache: Map<string, IFileData>

  constructor() {
    this._dataCache = new Map()
  }

  public async load(uri: string): Promise<IFileData | undefined> {
    return this._dataCache.get(uri)
  }

  public async remove(uri: string): Promise<void> {
    this._dataCache.delete(uri)
  }

  public async save(uri: string, item: ITargetItem): Promise<void> {
    this._dataCache.set(uri, item.data)
  }
}
