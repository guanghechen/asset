import type {
  IAssetPluginLocateOutput,
  IAssetPluginParseInput,
  IAssetPluginParseOutput,
  IAssetPluginPolishInput,
  IAssetPluginPolishOutput,
} from '@guanghechen/asset-types'
import type { Definition, EcmaImport, FootnoteDefinition, Root } from '@yozora/ast'
import type { IHeadingToc } from '@yozora/ast-util'
import type { IAplayerOptions } from './types.aplayer'

export interface IParser {
  /**
   * Processing raw markdown content into ast object.
   * @param content     source content
   * @param startIndex  start index of content
   * @param endIndex    end index of contents
   */
  parse(contents: Iterable<string> | string): Root
}

export const MarkdownAssetType = 'markdown'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type MarkdownAssetType = typeof MarkdownAssetType

export interface IMarkdownFrontmatter {
  /**
   * Aplayer options for playing audio for the post.
   */
  aplayer?: IAplayerOptions
  /**
   * Customized excerpt of the markdown content.
   */
  excerpt?: string
  /**
   * Time to read the post.
   */
  timeToRead?: number
  /**
   * Extra data.
   */
  [key: string]: unknown
}

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
   * Options for aplayer.
   */
  aplayer?: IAplayerOptions
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

export const isMarkdownAssetLocateOutput = (
  embryo: Readonly<IAssetPluginLocateOutput> | null,
): embryo is IAssetPluginLocateOutput => embryo?.type === MarkdownAssetType

export type IMarkdownAssetParseOutput = IAssetPluginParseOutput<IMarkdownResolvedData>
export const isMarkdownAssetParseOutput = (
  input: Readonly<IAssetPluginParseInput>,
  embryo: Readonly<IAssetPluginParseOutput> | null,
): embryo is Readonly<IMarkdownAssetParseOutput> =>
  input?.type === MarkdownAssetType && embryo !== null

export type IMarkdownAssetPolishInput = IAssetPluginPolishInput<IMarkdownPolishedData>
export const isMarkdownAssetPolishInput = (
  input: Readonly<IAssetPluginPolishInput> | null,
): input is Readonly<IMarkdownAssetPolishInput> => input?.type === MarkdownAssetType

export type IMarkdownAssetPolishOutput = IAssetPluginPolishOutput<IMarkdownPolishedData>
export const isMarkdownPolishOutput = (
  input: Readonly<IAssetPluginPolishInput> | null,
  embryo: Readonly<IAssetPluginPolishOutput> | null,
): embryo is Readonly<IMarkdownAssetPolishOutput> =>
  input?.type === MarkdownAssetType && embryo !== null
