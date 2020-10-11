import type { AssetUUID, TagUUID } from './_types'


/**
 *
 */
export type RawTagDataItem = TagUUID | Pick<TagDataItem, 'uuid'>


/**
 * Tag item
 */
export interface TagDataItem {
  /**
   * Unique identification of tag
   */
  uuid: TagUUID
  /**
   * Displayed name of tag
   */
  title: string
  /**
   * Universally Unique Identifier list of assets which tagged this tag
   */
  assets: AssetUUID[]
}


/**
 * Tag data map
 */
export interface TagDataMap {
  /**
   * Tag uuid list
   */
  uuids: TagUUID[]
  /**
   * Tag entities
   */
  entities: Record<TagUUID, TagDataItem>
}
