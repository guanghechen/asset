import type { AssetDataItem, AssetUUID } from '@guanghechen/site-api'
import { BlogSourceType } from '../../config/blog'


/**
 * Post data
 */
export interface PostEntity extends AssetDataItem<BlogSourceType.POST> {
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
export interface PostDataItem extends AssetDataItem<BlogSourceType.POST> {
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
