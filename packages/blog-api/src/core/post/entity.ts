import type { AssetDataItem } from '@guanghechen/site-api'
import type { Root } from '@yozora/ast'
import type { BlogSourceType } from '../../config/blog'

/**
 * Post data item
 */
export interface PostDataItem extends AssetDataItem<BlogSourceType.POST> {
  /**
   * Detailed classification of the post-document
   */
  docType: 'markdown' | string
}

/**
 * Post asset entity
 */
export interface PostAssetEntity extends AssetDataItem<BlogSourceType.POST> {
  /**
   * Detailed classification of the post-document
   */
  docType: 'markdown' | string
  /**
   * Markdown content
   */
  content: Root
}
