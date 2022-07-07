import type { IAssetCategoryId, IAssetId, IAssetTagId } from './_misc'

export enum AssetType {
  FILE = 'FILE',
  MARKDOWN_AST = 'MARKDOWN_AST',
}

export interface IAssetMeta {
  /**
   * Global unique identifier.
   */
  guid: IAssetId
  /**
   * The hash value of the contents.
   */
  fingerprint: string
}

export interface IAssetEntity<D = unknown> {
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
   * Asset data.
   */
  data?: D
}

export interface IAsset {
  meta: IAssetMeta
  entity: IAssetEntity
}

export interface IAssetMap {
  entities: IAssetMeta[]
}
