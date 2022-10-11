import type { AssetDataType, IAssetEntity } from '@guanghechen/asset-core'

export interface IAssetPluginPolishApi {
  /**
   * Load source content.
   * @param relativeSrcLocation
   */
  loadContent(relativeSrcLocation: string): Promise<Buffer | null>
  /**
   * Load source content (synchronously).
   * @param relativeSrcLocation
   */
  loadContentSync(relativeSrcLocation: string): Buffer | null
  /**
   * Resolve asset by source location.
   * @param relativeLocation
   */
  resolveAsset(relativeLocation: string): Pick<IAssetEntity, 'uri' | 'slug' | 'title'> | null
}

export interface IAssetPluginPolishNext {
  (embryo: Readonly<IAssetPluginPolishOutput> | null):
    | IAssetPluginPolishOutput
    | null
    | Promise<IAssetPluginPolishOutput | null>
}

export interface IAssetPluginPolish {
  (
    input: Readonly<IAssetPluginPolishInput>,
    embryo: Readonly<IAssetPluginPolishOutput> | null,
    api: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): IAssetPluginPolishOutput | null | Promise<IAssetPluginPolishOutput | null>
}

export interface IAssetPluginPolishInput<D = unknown> {
  /**
   * Asset type.
   */
  type: string
  /**
   * Asset tittle.
   */
  title: string
  /**
   * Asset data.
   */
  data: D | null
}

export interface IAssetPluginPolishOutput<D = unknown> {
  /**
   * Asset data type.
   */
  dataType: AssetDataType
  /**
   * Asset data.
   */
  data: D | Promise<D>
  /**
   * Which charset should the output data take.
   */
  encoding?: BufferEncoding
}
