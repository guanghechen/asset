import type { IAssetEntity } from './asset'

export interface IAssetResolver {
  /**
   * Create an initial asset.
   * @param location
   */
  initAsset(location: string): Promise<IAssetEntity | null> | IAssetEntity | null
  /**
   * Save the resolved asset.
   * @param asset
   */
  saveAsset(asset: Readonly<IAssetEntity>): Promise<void>
  /**
   * Give an identifier for the location.
   * @param location
   */
  identifyLocation(location: string): string
  /**
   * Resolve asset location with the relative path pieces.
   * @param pathPieces
   */
  resolveLocation(...pathPieces: string[]): string
  /**
   * Resolve page slug.
   * @param slug
   */
  resolveSlug(slug: string | undefined): string
  /**
   * Resolve asset uri.
   */
  resolveUri(asset: Pick<IAssetEntity, 'guid' | 'type' | 'extname'>): string
}
