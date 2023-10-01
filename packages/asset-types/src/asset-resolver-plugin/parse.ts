import type { IAsset, IAssetMeta } from '../asset'
import type { IBinaryFileData } from '../asset-file'

export interface IAssetPluginParseApi {
  /**
   * Load source content.
   * @param absoluteSrcPath
   */
  loadContent(absoluteSrcPath: string): Promise<IBinaryFileData | null>
  /**
   * Resolve asset by absoluteSrcPath.
   * @param absoluteSrcPath
   */
  resolveAsset(absoluteSrcPath: string): Promise<Readonly<IAsset> | null>
  /**
   * Resolve src path.
   * @param srcPathRelativeToCurDir the path relative to the parent path of the current resource.
   */
  resolveRefPath(srcPathRelativeToCurDir: string): Promise<string | null>
  /**
   * Resolve asset slug.
   * @param meta
   */
  resolveSlug(meta: Readonly<IAssetMeta>): Promise<string | null>
}

export interface IAssetPluginParseNext {
  (embryo: Readonly<IAssetPluginParseOutput> | null): Promise<IAssetPluginParseOutput | null>
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
   * Relative path to the source root.
   */
  src: string
  /**
   * File extension (without dot).
   */
  extname: string | undefined
  /**
   * Source file content.
   */
  content: IBinaryFileData
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
