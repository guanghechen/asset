import type { AssetDataItem } from '@guanghechen/site-api'

export const MarkdownAssetType = 'markdown'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type MarkdownAssetType = typeof MarkdownAssetType

/**
 * Markdown data
 */
export interface MarkdownAssetDataItem
  extends AssetDataItem<MarkdownAssetType> {}
