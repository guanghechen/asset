import type { MdastRoot } from '@guanghechen/ast-md-props'
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
    content: MdastRoot
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
  }
)
