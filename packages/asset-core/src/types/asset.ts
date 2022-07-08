import type { IAssetCategoryId, IAssetId, IAssetTagId } from './_misc'

export enum AssetType {
  FILE = 'FILE',
}

export interface IAsset {
  /**
   * Global unique identifier.
   */
  guid: IAssetId
  /**
   * The hash value of the contents.
   */
  fingerprint: string
  /**
   * Type of asset.
   */
  type: AssetType | string
  /**
   * Asset file extension.
   */
  extname: string
  /**
   * The created date of the asset (ISOString).
   */
  createdAt: string
  /**
   * The last modification date of the asset (ISOString).
   */
  updatedAt: string
  /**
   * Unique identifier list of asset categories.
   */
  categories: IAssetCategoryId[]
  /**
   * Unique identifier list of asset tags.
   */
  tags: IAssetTagId[]
  /**
   * Title of asset.
   */
  title: string
  /**
   * A stable page uri to reveal this asset.
   */
  slug?: string
}

export interface IAssetEntity {
  /**
   * Asset data
   */
  data: unknown | undefined
}

export interface IAssetDataMap {
  entities: IAsset[]
}
