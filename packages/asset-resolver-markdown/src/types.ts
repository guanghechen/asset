import type {
  IAssetPluginParseInput,
  IAssetPluginParseOutput,
  IAssetPluginPolishInput,
  IAssetPluginPolishOutput,
  IAssetPluginResolveOutput,
  IAssetResolverPlugin,
} from '@guanghechen/asset-types'
import type {
  Association,
  Definition,
  EcmaImport,
  FootnoteDefinition,
  Paragraph,
  Root,
} from '@yozora/ast'
import type { IHeadingToc } from '@yozora/ast-util'
import type { IAplayerOptions } from './types.aplayer'

export interface IParser {
  /**
   * Processing raw markdown content into ast object.
   * @param content     source content
   * @param startIndex  start index of content
   * @param endIndex    end index of contents
   */
  parse(
    contents: Iterable<string> | string,
    options: {
      /**
       * Whether it is necessary to reserve the position in the Node produced.
       */
      readonly shouldReservePosition?: boolean

      /**
       * Preset definition meta data list.
       */
      readonly presetDefinitions?: Association[]

      /**
       * Preset footnote definition meta data list.
       */
      readonly presetFootnoteDefinitions?: Association[]
    },
  ): Root
}

export interface IPreviewImageItem {
  /**
   * Image url
   */
  src: string
  /**
   * Alt of image.
   */
  alt: string
}

export const MarkdownAssetType = 'markdown'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type MarkdownAssetType = typeof MarkdownAssetType

export interface IMarkdownResolverPluginContext {
  getPresetDefinitions: () => Definition[] | undefined
  getPresetFootnoteDefinitions: () => FootnoteDefinition[] | undefined
  parseMarkdown: (content: string) => Root
  resolvable: (filename: string) => boolean
}

export type IMarkdownResolverPlugin = (ctx: IMarkdownResolverPluginContext) => IAssetResolverPlugin

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

export interface IMarkdownParsedData {
  /**
   * Markdown title.
   */
  title: Paragraph
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
   * Markdown title.
   */
  title: Paragraph
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
   * Images collected from the ast.
   */
  images?: IPreviewImageItem[]
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
  embryo: Readonly<IAssetPluginResolveOutput> | null,
): embryo is IAssetPluginResolveOutput => embryo?.sourcetype === MarkdownAssetType

export type IMarkdownAssetParseOutput = IAssetPluginParseOutput<IMarkdownParsedData>
export const isMarkdownAssetParseOutput = (
  input: Readonly<IAssetPluginParseInput>,
  embryo: Readonly<IAssetPluginParseOutput> | null,
): embryo is Readonly<IMarkdownAssetParseOutput> =>
  input?.sourcetype === MarkdownAssetType && embryo !== null

export type IMarkdownAssetPolishInput = IAssetPluginPolishInput<IMarkdownPolishedData>
export const isMarkdownAssetPolishInput = (
  input: Readonly<IAssetPluginPolishInput>,
): input is Readonly<IMarkdownAssetPolishInput> => input.sourcetype === MarkdownAssetType

export type IMarkdownAssetPolishOutput = IAssetPluginPolishOutput<IMarkdownPolishedData>
export const isMarkdownPolishOutput = (
  input: Readonly<IAssetPluginPolishInput>,
  embryo: Readonly<IAssetPluginPolishOutput> | null,
): embryo is Readonly<IMarkdownAssetPolishOutput> =>
  input.sourcetype === MarkdownAssetType && embryo !== null
