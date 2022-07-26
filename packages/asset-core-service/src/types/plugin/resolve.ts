import type { IAssetId } from '@guanghechen/asset-core'

export interface IAssetPluginResolveApi {
  /**
   * Load source content.
   * @param srcLocation
   */
  loadContent(srcLocation: string): Promise<Buffer>
  /**
   * Resolve asset slug.
   * @param slug
   */
  resolveSlug(slug: string | null | undefined): string | null
}

export interface IAssetPluginResolveNext {
  (embryo: Readonly<IAssetPluginResolveOutput> | null):
    | IAssetPluginResolveOutput
    | null
    | Promise<IAssetPluginResolveOutput | null>
}

export interface IAssetPluginResolve {
  (
    input: Readonly<IAssetPluginResolveInput>,
    embryo: Readonly<IAssetPluginResolveOutput> | null,
    api: Readonly<IAssetPluginResolveApi>,
    next: IAssetPluginResolveNext,
  ): IAssetPluginResolveOutput | null | Promise<IAssetPluginResolveOutput | null>
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
   * Asset title.
   */
  title: string
  /**
   * Raw content.
   */
  content: Buffer
}

export interface IAssetPluginResolveOutput<D = unknown> {
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
  data: D | null
}
