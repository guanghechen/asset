import type { Definition, EcmaImport, FootnoteDefinition, Root } from '@yozora/ast'
import type { IHeadingToc } from '@yozora/ast-util'

export const MarkdownAssetType = 'markdown'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type MarkdownAssetType = typeof MarkdownAssetType

export interface IMarkdownResolvedData {
  /**
   * Markdown ast.
   */
  ast: Root
  /**
   * Markdown frontmatter.
   */
  frontmatter: IMarkdownFrontmatter
}

export interface IMarkdownPolishedData {
  /**
   * Markdown ast.
   */
  ast: Root
  /**
   * Markdown content ECMA imports.
   */
  ecmaImports?: EcmaImport[]
  /**
   * Markdown content definitions.
   */
  definitionMap?: Readonly<Record<string, Definition>>
  /**
   * Markdown content footnote definitions.
   */
  footnoteDefinitionMap?: Readonly<Record<string, FootnoteDefinition>>
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
