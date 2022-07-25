import type { IAssetId } from '@guanghechen/asset-core'
import type { IBuffer } from '../misc'

export interface IAssetPluginResolveApi {
  /**
   * Load source content.
   * @param srcLocation
   */
  loadContent(srcLocation: string): Promise<IBuffer>
  /**
   * Resolve asset slug.
   * @param slug
   */
  resolveSlug(slug: string | undefined): string
}

export interface IAssetPluginResolveNext {
  (embryo: IAssetPluginResolveInput):
    | IAssetPluginResolveOutput
    | null
    | Promise<IAssetPluginResolveOutput | null>
}

export interface IAssetPluginResolve {
  (embryo: IAssetPluginResolveInput, api: IAssetPluginResolveApi, next: IAssetPluginResolveNext):
    | IAssetPluginResolveOutput
    | null
    | Promise<IAssetPluginResolveOutput | null>
}

export interface IAssetPluginResolveInput {
  /**
   * Asset global unique identifier.
   */
  guid: IAssetId
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
   * Name of the source file.
   */
  filename: string
  /**
   * Raw content.
   */
  content: IBuffer
}

export interface IAssetPluginResolveOutput {
  /**
   * Asset content type.
   */
  type: string
  /**
   * Asset MIME type.
   */
  mimetype: string
  /**
   * Title of asset.
   */
  title: string
  /**
   * Resolved asset extname. ( uri = xxx + guid + extname )
   */
  extname: string
  /**
   * A stable page url to reveal this asset.
   */
  slug: string | null
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
  /**
   * Asset data
   */
  data: unknown | null
}
