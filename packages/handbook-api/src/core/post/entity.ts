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
  content: any
  /**
   * Summary content
   */
  summary: any
}


/**
 * Post data
 */
export type PostEntity = AssetDataItem<HandbookSourceType.POST> & (
  {
    /**
     * The type of the post document
     */
    docType: 'markdown'
    /**
     * Document body content
     */
    content: any
  }
)


/**
 * Only include meta information of PostData
 */
export type PostDataItem = AssetDataItem<HandbookSourceType.POST> & (
  {
    /**
     * The type of the post document
     */
    docType: 'markdown'
    /**
     * Summary content
     */
    summary: any
  }
)
