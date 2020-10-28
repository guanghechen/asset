import type { AssetDataItem } from '@guanghechen/site-api'


export const AssetMarkdownType = 'markdown'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AssetMarkdownType = typeof AssetMarkdownType


/**
 * Markdown data
 */
export interface AssetMarkdownEntity<D> extends AssetDataItem<AssetMarkdownType> {
  /**
   * Markdown body content
   */
  content: D
}
