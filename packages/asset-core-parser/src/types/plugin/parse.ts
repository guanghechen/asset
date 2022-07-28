import type { IAssetId } from '@guanghechen/asset-core'

export interface IAssetParserPluginParseApi {
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
   * Resolve asset slug.
   * @param slug
   */
  resolveSlug(slug: string | null | undefined): string | null
}

export interface IAssetParserPluginParseNext {
  (embryo: Readonly<IAssetParserPluginParseOutput> | null):
    | IAssetParserPluginParseOutput
    | null
    | Promise<IAssetParserPluginParseOutput | null>
}

export interface IAssetParserPluginParse {
  (
    input: Readonly<IAssetParserPluginParseInput>,
    embryo: Readonly<IAssetParserPluginParseOutput> | null,
    api: Readonly<IAssetParserPluginParseApi>,
    next: IAssetParserPluginParseNext,
  ): IAssetParserPluginParseOutput | null | Promise<IAssetParserPluginParseOutput | null>
}

export interface IAssetParserPluginParseInput {
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

export interface IAssetParserPluginParseOutput<D = unknown> {
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
