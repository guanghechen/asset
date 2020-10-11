import type { AssetDataItem, AssetUUID } from '@guanghechen/site-api'


export const PostAssetType = 'post'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type PostAssetType = typeof PostAssetType


/**
 * Post data
 */
export interface PostEntity extends AssetDataItem<PostAssetType> {
  /**
   * The type of the post document
   */
  docType: 'markdown'
  /**
   * Document body content
   */
  content: string
}


/**
 * Only include meta information of PostData
 */
export interface PostDataItem extends AssetDataItem<PostAssetType> {
  /**
   * The type of the post document
   */
  docType: 'markdown'
  /**
   * Summary content
   */
  summary: string
}


/**
 * Post data map
 */
export interface PostDataMap {
  /**
   * Post uuid list
   */
  uuids: AssetUUID[]
  /**
   * Post entities
   */
  entities: Record<AssetUUID, PostDataItem>
}
