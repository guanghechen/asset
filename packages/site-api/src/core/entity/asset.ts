import type {
  AssetLocation,
  AssetType,
  AssetUUID,
  CategoryUUID,
  TagUUID,
} from './_types'


/**
 * Asset item
 */
export interface AssetEntity<T extends AssetType = AssetType> {
  /**
   * Universally Unique Identifier of asset
   */
  uuid: AssetUUID
  /**
   * Type of asset
   */
  type: T
  /**
   * The hash value of the contents
   */
  fingerprint: string
  /**
   * Location of asset
   */
  location: AssetLocation
  /**
   * Asset extname (such as '.json', '.png')
   */
  extname: string
  /**
   * The timestamp of the last time the file was modified (Millisecond)
   */
  lastModifiedTime: number
  /**
   * The created date of the asset (ISOString)
   */
  createAt: string
  /**
   * The last modification date of the asset (ISOString)
   */
  updateAt: string
  /**
   * Title of asset
   */
  title: string
  /**
   * Parallel tags
   */
  tags: TagUUID[]
  /**
   * Categories
   */
  categories: CategoryUUID[][]
}


/**
 * Asset item of AssetDataMap
 */
export type AssetDataItem<T extends AssetType = AssetType> = AssetEntity<T>


/**
 * Rough AssetDataItem
 */
export type RoughAssetDataItem = Omit<AssetDataItem, 'type'>


/**
 * Asset data map
 */
export interface AssetDataMap {
  /**
   * Asset <type, uuid list> map
   */
  uuids: Record<AssetType, AssetUUID[]>
  /**
   * Asset <location, uuid> map
   */
  locations: Record<AssetLocation, AssetUUID>
  /**
   * Asset entities
   */
  entities: Record<AssetUUID, AssetDataItem>
}
