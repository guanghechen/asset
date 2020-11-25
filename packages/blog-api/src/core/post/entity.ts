import type { MdastRoot } from '@guanghechen/asset-markdown-parser'
import type { AssetDataItem } from '@guanghechen/site-api'
import type { BlogSourceType } from '../../config/blog'


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
export type PostEntity = AssetDataItem<BlogSourceType.POST> & (
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
export type PostDataItem = AssetDataItem<BlogSourceType.POST> & (
  {
    /**
     * The type of the post document
     */
    docType: 'markdown'
  }
)
