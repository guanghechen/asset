import type { IAssetCategoryId, IAssetId, IAssetTagId } from './_misc'

export interface IAsset {
  /**
   * Global unique identifier.
   */
  guid: IAssetId
  /**
   * Type of asset.
   */
  type: string
  /**
   * The hash value of the contents.
   */
  fingerprint: string
  /**
   * Asset data location.
   */
  location: string
  /**
   * The created date of the asset (ISOString).
   */
  createdAt: string
  /**
   * The last modification date of the asset (ISOString).
   */
  updatedAt: string
  /**
   * Title of asset.
   */
  title: string
  /**
   * Unique identifier list of asset categories.
   */
  categories: IAssetCategoryId[]
  /**
   * Unique identifier list of asset tags.
   */
  tags: IAssetTagId[]
}
