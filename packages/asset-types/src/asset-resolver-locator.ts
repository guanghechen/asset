import type { IResolvingAsset } from './asset'

export interface IAssetResolverLocator {
  /**
   * Try to locate an resolving asset.
   * @param locationId
   */
  locateAsset(locationId: string): Promise<IResolvingAsset | null | undefined>
  /**
   * Remove asset from locator.
   * @param locationId
   */
  removeAsset(locationId: string): Promise<void>
  /**
   * Set asset to locator.
   * @param locationId
   * @param asset
   */
  insertAsset(locationId: string, asset: IResolvingAsset | null): Promise<void>
}
