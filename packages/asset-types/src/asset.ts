export interface IAssetMeta {
  /**
   * Asset url path.
   */
  uri: string
  /**
   * A stable page url to reveal this asset.
   */
  slug: string | null
  /**
   * Title of asset.
   */
  title: string
}

export interface IAssetLocation {
  /**
   * Asset global unique identifier.
   */
  guid: string
  /**
   * Asset content type.
   */
  type: string
  /**
   * Asset MIME type.
   */
  mimetype: string
  /**
   * File extension (without dot prefix).
   */
  extname: string | undefined
}

export interface IAsset extends IAssetMeta, IAssetLocation {
  /**
   * The fingerprint of the asset content.
   */
  hash: string
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

export interface IResolvingAsset extends IAsset {
  filename: string
  data: unknown | null
}
