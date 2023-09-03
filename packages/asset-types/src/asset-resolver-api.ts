import type { IAssetLocation } from './asset'
import type { IAssetPluginLocateInput } from './plugin/locate'

export type IAssetUrlPrefixResolver = (params: { assetType: string; mimetype: string }) => string

export interface IAssetResolverApi {
  /**
   * Generate a unique id for the asset.
   * @param location
   */
  identifyLocation(location: string): string
  /**
   * Create an initial asset.
   * @param location
   */
  initAsset(location: string): Promise<IAssetPluginLocateInput | null>
  /**
   * Load content by source file location.
   * @param location
   */
  loadContent(location: string): Promise<Buffer | null>
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
