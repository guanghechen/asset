import type { IAsset } from '@guanghechen/asset-core'
import type { AssetDataType } from './misc'
import type { IAssetPluginResolveInput } from './plugin/resolve'

export interface IAssetResolver {
  /**
   * Create an initial asset.
   * @param srcLocation
   */
  initAsset(
    srcLocation: string,
  ): IAssetPluginResolveInput | null | Promise<IAssetPluginResolveInput | null>
  /**
   * Save the resolved asset.
   * @param params
   */
  saveAsset(params: {
    uri: string
    dataType: AssetDataType
    data: unknown
    encoding?: BufferEncoding
  }): Promise<void>
  /**
   * Give an identifier for the location.
   * @param location
   */
  identifyLocation(location: string): string
  /**
   * Load content through source location.
   * @param srcLocation
   */
  loadSrcContent(srcLocation: string): Promise<Buffer>
  /**
   * Resolve asset location with the relative path pieces.
   * @param pathPieces
   */
  resolveLocation(...pathPieces: string[]): string
  /**
   * Resolve page slug.
   * @param slug
   */
  resolveSlug(slug: string | null | undefined): string | null
  /**
   * Resolve asset uri.
   * @param params
   */
  resolveUri(params: Pick<IAsset, 'guid' | 'type' | 'mimetype'>): string
}
