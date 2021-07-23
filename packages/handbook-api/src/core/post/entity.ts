import type { AssetDataItem } from '@guanghechen/site-api'
import type { Root } from '@yozora/ast'
import type { HandbookSourceType } from '../../config/handbook'

/**
 * Post data item
 */
export interface PostDataItem extends AssetDataItem<HandbookSourceType.POST> {
  /**
   * Detailed classification of the post-document
   */
  docType: 'markdown' | string
}

/**
 * Post asset entity
 */
export interface PostAssetEntity
  extends AssetDataItem<HandbookSourceType.POST> {
  /**
   * Detailed classification of the post-document
   */
  docType: 'markdown' | string
  /**
   * Markdown content
   */
  content: Root
}
