import type { IAssetMeta } from '../asset'
import type { IBinaryFileData } from '../asset-file'

export interface IAssetPluginParseApi {
  /**
   * Load source content.
   * @param srcPathRelativeToCurDir the path relative to the parent path of the current resource.
   */
  loadContent(srcPathRelativeToCurDir: string): Promise<IBinaryFileData | null>
  /**
   * Resolve asset slug.
   * @param meta
   */
  resolveSlug(meta: Readonly<IAssetMeta>): Promise<string | null>
}

export interface IAssetPluginParseNext {
  (
    embryo: Readonly<IAssetPluginParseOutput> | null,
  ): IAssetPluginParseOutput | null | Promise<IAssetPluginParseOutput | null>
}

export interface IAssetPluginParse {
  (
    input: Readonly<IAssetPluginParseInput>,
    embryo: Readonly<IAssetPluginParseOutput> | null,
    api: Readonly<IAssetPluginParseApi>,
    next: IAssetPluginParseNext,
  ): IAssetPluginParseOutput | null | Promise<IAssetPluginParseOutput | null>
}

export interface IAssetPluginParseInput {
  /**
   * Asset source content type.
   */
  sourcetype: string
  /**
   * Asset tittle.
   */
  title: string
  /**
   * The source file name.
   */
  filename: string
  /**
   * File extension (without dot).
   */
  extname: string | undefined
  /**
   * Source file encoding.
   */
  encoding: BufferEncoding | undefined
}

export interface IAssetPluginParseOutput<D = unknown> {
  /**
   * Asset data
   */
  data: D | null
}
