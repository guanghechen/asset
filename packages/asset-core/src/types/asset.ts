import type { IAssetCategoryId, IAssetId, IAssetTagId } from './_misc'
import type { IAssetCategory } from './category'
import type { IAssetTag } from './tag'

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

export interface IAssetDataMap {
  tags: IAssetTag[]
  categories: IAssetCategory[]
  assets: IAsset[]
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
