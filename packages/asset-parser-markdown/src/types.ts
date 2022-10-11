import type { IAssetPluginPolishInput } from '@guanghechen/asset-core-plugin'
import type { Root } from '@yozora/ast'
import type { IHeadingToc } from '@yozora/ast-util'

export const MarkdownAssetType = 'markdown'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type MarkdownAssetType = typeof MarkdownAssetType

export const isMarkdownAsset = (
  input: Readonly<IAssetPluginPolishInput> | null,
): input is Readonly<IAssetPluginPolishInput<IMarkdownResolvedData>> =>
  input?.type === MarkdownAssetType

export interface IMarkdownResolvedData {
  /**
   * Markdown ast.
   */
  ast: Root
  /**
   * Markdown frontmatter.
   */
  frontmatter: IMarkdownFrontmatter
  /**
   * Markdown post excerpt ast.
   */
  excerpt?: Root
  /**
   * Time to read the post. (s)
   */
  timeToRead?: number
  /**
   * Title of contents.
   */
  toc?: IHeadingToc
}

export interface IMarkdownPolishedData {
  /**
   * Markdown ast.
   */
  ast: Root
  /**
   * Markdown frontmatter.
   */
  frontmatter: IMarkdownFrontmatter
  /**
   * Markdown post excerpt ast.
   */
  excerpt?: Root
  /**
   * Time to read the post. (ms)
   */
  timeToRead?: number
  /**
   * Title of contents.
   */
  toc?: IHeadingToc
}

export interface IMarkdownFrontmatter {
  /**
   *
   */
  excerpt?: string
  /**
   *
   */
  timeToRead?: number
  /**
   *
   */
  [key: string]: unknown
}
