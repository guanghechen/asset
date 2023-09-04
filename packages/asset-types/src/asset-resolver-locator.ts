import type { IAsset } from './asset'
import type { IAssetDataMap } from './asset-manager'

export interface IAssetResolverLocator {
  /**
   * Dump asset data map.
   */
  dumpAssetDataMap(): Promise<IAssetDataMap>
  /**
   * Set asset to locator.
   * @param locationId
   * @param asset
   */
  insertAsset(locationId: string, asset: IAsset | null): Promise<void>
  /**
   * Try to locate an resolving asset.
   * @param locationId
   */
  locateAsset(locationId: string): Promise<IAsset | null | undefined>
  /**
   * Remove asset from locator.
   * @param locationId
   */
  removeAsset(locationId: string): Promise<void>
  /**
   * Resolve asset uri prefix.
   * @param assetType
   * @param mimeType
   */
  resolveUriPrefix(assetType: string, mimeType: string): Promise<string>
}
