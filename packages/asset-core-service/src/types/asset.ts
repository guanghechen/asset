import type { IAssetId } from '@guanghechen/asset-core'

export enum AssetType {
  FILE = 'FILE',
  IMAGE = 'IMAGE',
}

export enum AssetEvent {
  CREATED = 'created',
  REMOVED = 'removed',
  RENAMED = 'renamed',
  UPDATED = 'updated',
}

export interface IAssetEntity {
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
  type: AssetType | string
  /**
   * Source virtual filepath (*nix style).
   */
  src: string
  /**
   * Extname of the source file.
   */
  extname: string
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
  /**
   * Asset data
   */
  data: unknown | null
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
