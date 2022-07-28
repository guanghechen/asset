import type { AssetDataType, IAssetEntity } from '../asset'

export interface IAssetParserPluginPolishApi {
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

export interface IAssetParserPluginPolishNext {
  (embryo: Readonly<IAssetParserPluginPolishOutput> | null):
    | IAssetParserPluginPolishOutput
    | null
    | Promise<IAssetParserPluginPolishOutput | null>
}

export interface IAssetParserPluginPolish {
  (
    input: Readonly<IAssetParserPluginPolishInput>,
    embryo: Readonly<IAssetParserPluginPolishOutput> | null,
    api: Readonly<IAssetParserPluginPolishApi>,
    next: IAssetParserPluginPolishNext,
  ): IAssetParserPluginPolishOutput | null | Promise<IAssetParserPluginPolishOutput | null>
}

export interface IAssetParserPluginPolishInput<D = unknown> {
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

export interface IAssetParserPluginPolishOutput<D = unknown> {
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
