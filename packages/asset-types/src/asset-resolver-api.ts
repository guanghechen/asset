import type { IAsset } from './asset'
import type { IAssetDataMap } from './asset-manager'
import type { AssetDataType } from './enum'
import type { IAssetPluginLocateInput } from './plugin/locate'

export type IAssetUrlPrefixResolver = (params: { assetType: string; mimetype: string }) => string

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
   * Resolve asset location with the relative path.
   * @param srcLocation
   */
  resolveSrcLocation(srcLocation: string): string
  /**
   * Resolve asset destination location with the asset uri.
   * @param uri
   */
  resolveDstLocationFromUri(uri: string): string
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
   * Remove the asset
   * @param uri
   */
  removeAsset(uri: string): Promise<void>
  /**
   * Save asset data map.
   * @param data
   */
  saveAssetDataMap(data: IAssetDataMap): Promise<void>
}
