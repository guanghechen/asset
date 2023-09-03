import type { IAsset } from './asset'

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
  getByGuid(guid: string): IAsset | undefined
  /**
   * Find assets by tag.
   * @param tag
   */
  getByTag(tag: string): IAsset[]
  /**
   * Find assets by category path.
   * @param categoryPath
   */
  getByCategory(categoryPath: ReadonlyArray<string>): IAsset[]
  /**
   * Add new asset.
   * @param asset
   */
  insert(asset: Readonly<IAsset>): void
  /**
   * Remove an asset.
   * @param guid
   */
  remove(guid: string): void
}
