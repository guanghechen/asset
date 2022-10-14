export type IAssetId = string

export interface IAsset {
  /**
   * Asset global unique identifier.
   */
  guid: IAssetId
  /**
   * The fingerprint of the asset content.
   */
  hash: string
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
   * Description of the content.
   */
  description: string | null
  /**
   * Asset url path.
   */
  uri: string
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
}
