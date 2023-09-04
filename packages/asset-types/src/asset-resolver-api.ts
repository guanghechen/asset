import type { IAsset, IAssetLocation } from './asset'
import type { IAssetDataMap } from './asset-manager'
import type { IAssetPluginLocateInput } from './plugin/locate'

export interface IAssetResolverApi {
  /**
   * Dump asset data map.
   */
  dumpAssetDataMap(): Promise<IAssetDataMap>
  /**
   * Create an initial asset.
   * @param location
   */
  initAsset(location: string): Promise<IAssetPluginLocateInput | null>
  /**
   * Set asset to locator.
   * @param location
   * @param asset
   */
  insertAsset(location: string, asset: IAsset | null): Promise<void>
  /**
   *
   * @param location
   */
  isRelativeLocation(location: string): boolean
  /**
   * Load content by source file location.
   * @param location
   */
  loadContent(location: string): Promise<Buffer | null>
  /**
   * Try to locate an resolving asset.
   * @param location
   */
  locateAsset(location: string): Promise<IAsset | null | undefined>
  /**
   * Remove asset from locator.
   * @param location
   */
  removeAsset(location: string): Promise<void>
  /**
   * Resolve page slug.
   * @param slug
   */
  resolveSlug(slug: string | null | undefined): Promise<string | null>
  /**
   * Resolve asset uri.
   * @param asset
   */
  resolveUri(asset: Readonly<IAssetLocation>): Promise<string>
}
