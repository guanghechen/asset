import type { IAsset, IAssetId } from './asset'

export interface IAssetDataMap {
  assets: IAsset[]
}

export interface IAssetManager {
  /**
   * Load maps from json data.
   * @param json
   * @param replace   If true, clear maps.
   */
  load(json: Readonly<IAssetDataMap>, replace: boolean): void
  /**
   * Dump to asset data map.
   */
  dump(): IAssetDataMap
  /**
   * Find asset by asset guid.
   * @param guid
   */
  getByGuid(guid: IAssetId): IAsset | undefined
  /**
   * Find assets by tag.
   * @param tag
   */
  getByTag(tag: string): IAsset[]
  /**
   * Find assets by category path.
   * @param categoryPath
   */
  getByCategory(categoryPath: string[]): IAsset[]
  /**
   * Add new asset.
   * @param asset
   */
  insert(asset: IAsset): void
  /**
   * Remove an asset.
   * @param guid
   */
  remove(guid: IAssetId): void
}
