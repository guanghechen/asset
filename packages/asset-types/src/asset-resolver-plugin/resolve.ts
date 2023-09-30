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
   * Source virtual filepath (*nix style).
   */
  src: string
  /**
   * The created date of the asset (ISOString).
   */
  createdAt: string
  /**
   * The last modification date of the asset (ISOString).
   */
  updatedAt: string
  /**
   * Asset title.
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

export interface IAssetPluginResolveOutput {
  /**
   * Asset source content type.
   */
  sourcetype: string
  /**
   * Asset MIME type.
   */
  mimetype: string
  /**
   * Title of asset.
   */
  title: string
  /**
   * Description of the content.
   */
  description: string | null
  /**
   * A stable page url to reveal this asset.
   */
  slug: string | null
  /**
   * A stage url to
   */
  uri: string | null
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
