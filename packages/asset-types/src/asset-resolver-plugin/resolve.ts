import type { IAssetMeta } from '../asset'
import type { IBinaryFileData } from '../asset-file'

export interface IAssetPluginResolveApi {
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
  /**
   * Resolve asset uri.
   * @param sourcetype
   * @param mimetype
   */
  resolveUri(sourcetype: string, mimetype: string): Promise<string>
}

export interface IAssetPluginResolveNext {
  (embryo: Readonly<IAssetPluginResolveOutput> | null): Promise<IAssetPluginResolveOutput | null>
}

export interface IAssetPluginResolveInput {
  /**
   * Asset global unique identifier.
   */
  guid: string
  /**
   * The fingerprint of the asset content.
   */
  hash: string
  /**
   * Relative path to the source root.
   */
  src: string
  /**
   * File extension (without dot).
   */
  extname: string | undefined
  /**
   * Asset content.
   */
  content: IBinaryFileData
  /**
   * Source file encoding.
   */
  encoding: BufferEncoding | undefined
  /**
   * Asset title.
   */
  title: string
  /**
   * The created date of the asset (ISOString).
   */
  createdAt: string
  /**
   * The last modification date of the asset (ISOString).
   */
  updatedAt: string
}

export interface IAssetPluginResolveOutput {
  /**
   * Asset MIME type.
   */
  mimetype: string
  /**
   * Asset source content type.
   */
  sourcetype: string
  /**
   * A stable page url to reveal this asset.
   */
  slug: string | null
  /**
   * A stage url to
   */
  uri: string | null
  /**
   * Title of asset.
   */
  title: string
  /**
   * Description of the content.
   */
  description: string | null
  /**
   * The created date of the asset (ISOString).
   */
  createdAt: string
  /**
   * The last modification date of the asset (ISOString).
   */
  updatedAt: string
  /**
   * Asset categories, each element represent a category path.
   */
  categories: string[][]
  /**
   * Asset tags.
   */
  tags: string[]
}
