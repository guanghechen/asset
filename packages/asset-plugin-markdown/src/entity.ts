import type { Root } from '@yozora/ast'

export const AssetMarkdownType = 'markdown'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AssetMarkdownType = typeof AssetMarkdownType

export interface IAssetMarkdownData {
  /**
   * Markdown ast.
   */
  ast: Root
}
