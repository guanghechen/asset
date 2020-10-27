import type { AssetDataItem } from '@guanghechen/site-api'


export const AssetMarkdownType = 'markdown'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AssetMarkdownType = typeof AssetMarkdownType


export interface AssetMarkdownEntityContent<T extends unknown = unknown> {
  /**
   * Markdown body content
   */
  content: T
  /**
   * Markdown summary content
   */
  summary: T
}


/**
 * Post data
 */
export interface AssetMarkdownEntity
  extends AssetDataItem<AssetMarkdownType>, AssetMarkdownEntityContent {

}
