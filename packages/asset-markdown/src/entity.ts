import type { AssetDataItem } from '@guanghechen/site-api'


export const AssetMarkdownType = 'markdown'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AssetMarkdownType = typeof AssetMarkdownType


/**
 * Post data
 */
export interface AssetMarkdownEntity extends AssetDataItem<AssetMarkdownType> {
  /**
   * Document body content
   */
  content: string
  /**
   * Summary content
   */
  summary: string
}
