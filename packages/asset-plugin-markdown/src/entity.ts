import type { Root } from '@yozora/ast'

export const AssetMarkdownType = 'markdown'
export type AssetMarkdownType = typeof AssetMarkdownType

export interface IAssetMarkdownData {
  /**
   * Markdown ast.
   */
  ast: Root
}
