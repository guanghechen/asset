import type { IAssetParserPluginPolishInput } from '@guanghechen/asset-core-parser'
import type { Root } from '@yozora/ast'

export const MarkdownAssetType = 'markdown'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type MarkdownAssetType = typeof MarkdownAssetType

export const isMarkdownAsset = (
  input: Readonly<IAssetParserPluginPolishInput> | null,
): input is Readonly<IAssetParserPluginPolishInput<IMarkdownResolvedData>> =>
  input?.type === MarkdownAssetType

export interface IMarkdownResolvedData {
  /**
   * Markdown ast.
   */
  ast: Root
}

export interface IMarkdownPolishedData {
  /**
   * Markdown ast.
   */
  ast: Root
}
