import type { IAsset } from './asset'
import type { IAssetDataMap } from './asset-manager'
import type { AssetDataType } from './enum'
import type { IAssetPluginLocateInput } from './plugin/locate'

export interface IAssetResolverApi {
  /**
   * Create an initial asset.
   * @param srcLocation
   */
  initAsset(
    srcLocation: string,
  ): IAssetPluginLocateInput | null | Promise<IAssetPluginLocateInput | null>
  /**
   * Load content by source file location.
   * @param srcLocation
   */
  loadSrcContent(srcLocation: string): Promise<Buffer | null>
  /**
   * Normalize the location string to generate an identifier.
   * @param srcLocation
   */
  normalizeLocation(srcLocation: string): string
  /**
   * Resolve asset location with the relative path pieces.
   * @param srcPathPieces
   */
  resolveSrcLocation(...srcPathPieces: string[]): string
  /**
   * Resolve page slug.
   * @param slug
   */
  resolveSlug(slug: string | null | undefined): string | null
  /**
   * Resolve asset uri.
   * @param params
   */
  resolveUri(params: Pick<IAsset, 'guid' | 'type' | 'mimetype' | 'extname'>): string
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
   * Save asset data map.
   * @param data
   */
  saveAssetDataMap(data: IAssetDataMap): Promise<void>
}
