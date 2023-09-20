import type { IAssetLocation, IAssetMeta } from './asset'

export interface IAssetUriResolver {
  /**
   * Resolve page slug.
   * @param asset
   */
  resolveSlug(asset: Readonly<IAssetMeta>): Promise<string | null>
  /**
   * Resolve asset uri.
   * @param asset
   */
  resolveUri(asset: Readonly<IAssetLocation>): Promise<string>
}
