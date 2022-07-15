import type { IAssetCategoryId, IAssetId, IAssetTagId } from './_misc'
import type { IAssetCategory } from './category'
import type { IAssetTag } from './tag'

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
  type: string
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
}

export interface IAssetDataMap {
  assets: IAsset[]
  categories: IAssetCategory[]
  tags: IAssetTag[]
}

export type IRawAsset = Omit<IAsset, 'categories' | 'tags'> & {
  categories: string[][]
  tags: string[]
}

export interface IAssetManager {
  fromJSON(json: Readonly<IAssetDataMap>): void
  toJSON(): IAssetDataMap
  findByGuid(guid: IAssetId): IAsset | undefined
  insert(rawAsset: IRawAsset): IAsset | undefined
  remove(guid: IAssetId): void
}
