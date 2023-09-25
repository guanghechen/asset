import type { IAssetMeta } from '../asset'
import type { IBinaryFileData } from '../asset-file'

export interface IAssetPluginLocateApi {
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

export interface IAssetPluginLocateNext {
  (
    embryo: Readonly<IAssetPluginLocateOutput> | null,
  ): IAssetPluginLocateOutput | null | Promise<IAssetPluginLocateOutput | null>
}

export interface IAssetPluginLocate {
  (
    input: Readonly<IAssetPluginLocateInput>,
    embryo: Readonly<IAssetPluginLocateOutput> | null,
    api: Readonly<IAssetPluginLocateApi>,
    next: IAssetPluginLocateNext,
  ): IAssetPluginLocateOutput | null | Promise<IAssetPluginLocateOutput | null>
}

export interface IAssetPluginLocateInput {
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
   * The source file name which can be used to locate this asset by `api.loadContent(filename)`.
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

export interface IAssetPluginLocateOutput {
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
