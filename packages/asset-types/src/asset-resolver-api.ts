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
   * @param srcPath
   */
  initAsset(srcPath: string): Promise<IAssetPluginLocateInput | null>
  /**
   * Set asset to locator.
   * @param srcPath
   * @param asset
   */
  insertAsset(srcPath: string, asset: IAsset | null): Promise<void>
  /**
   *
   * @param srcPath
   */
  isRelativePath(srcPath: string): boolean
  /**
   * Load content by source file srcPath.
   * @param srcPath
   */
  loadContent(srcPath: string): Promise<Buffer | null>
  /**
   * Try to locate an resolving asset.
   * @param srcPath
   */
  locateAsset(srcPath: string): Promise<IAsset | null | undefined>
  /**
   * Remove asset from locator.
   * @param srcPath
   */
  removeAsset(srcPath: string): Promise<void>
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
