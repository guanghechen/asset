import type { AssetDataItem } from '@guanghechen/site-api'
import type { HandbookSourceType } from '../../config/handbook'


/**
 * Post asset item
 *
 * Used within the PostProcessor, as the first data type of result returned
 * by the `realProcessors[<index>].process()`
 */
export interface PostAssetEntity extends AssetDataItem {
  /**
   * Document body content
   */
  content: string
  /**
   * Summary content
   */
  summary: string
}


/**
 * Post data
 */
export interface PostEntity extends AssetDataItem<HandbookSourceType.POST> {
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
export interface PostDataItem extends AssetDataItem<HandbookSourceType.POST> {
  /**
   * The type of the post document
   */
  docType: 'markdown'
  /**
   * Summary content
   */
  summary: string
}
