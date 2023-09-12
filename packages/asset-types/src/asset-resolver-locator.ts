import type { IAsset } from './asset'
import type { IAssetDataMap } from './asset-manager'

export interface IAssetResolverLocator {
  /**
   * Dump asset data map.
   */
  dumpAssetDataMap(): Promise<IAssetDataMap>
  /**
   * Set asset to locator.
   * @param srcPathId
   * @param asset
   */
  insertAsset(srcPathId: string, asset: IAsset | null): Promise<void>
  /**
   * Try to locate an resolving asset.
   * @param srcPathId
   */
  locateAsset(srcPathId: string): Promise<IAsset | null | undefined>
  /**
   * Remove asset from locator.
   * @param srcPathId
   */
  removeAsset(srcPathId: string): Promise<void>
}
