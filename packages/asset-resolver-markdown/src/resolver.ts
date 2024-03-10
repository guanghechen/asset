import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import type {
  IAsset,
  IAssetParsePlugin,
  IAssetPlugin,
  IAssetPluginParseMiddleware,
  IAssetPluginParseMiddlewares,
  IAssetPluginParseNext,
  IAssetPluginParseOutput,
  IAssetPluginPolishMiddleware,
  IAssetPluginPolishMiddlewares,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetPluginResolveMiddleware,
  IAssetPluginResolveMiddlewares,
  IAssetPluginResolveNext,
  IAssetPluginResolveOutput,
  IAssetPolishPlugin,
  IAssetResolverPlugin,
} from '@guanghechen/asset-types'
import { AsyncMiddlewares } from '@guanghechen/middleware'
import { ParagraphType } from '@yozora/ast'
import type { Definition, FootnoteDefinition, Paragraph, Resource, Root } from '@yozora/ast'
import { collectInlineNodes, collectTexts, shallowMutateAstInPreorderAsync } from '@yozora/ast-util'
import dayjs from 'dayjs'
import yaml from 'js-yaml'
import type {
  IMarkdownParsedData,
  IMarkdownPolishedData,
  IMarkdownResolverPlugin,
  IMarkdownResolverPluginContext,
  IParser,
} from './types'
import { MarkdownAssetType, isMarkdownAssetPolishInput } from './types'

interface IProps {
  /**
   * Markdown parser.
   */
  parser: IParser
  /**
   * Check if the given file is in markdown format.
   * @default src => /\.md$/.test(src)
   */
  resolvable?(src: string): boolean
  /**
   * Get preset definitions.
   */
  getPresetDefinitions?: () => Definition[] | undefined
  /**
   * Get preset footnote definitions.
   */
  getPresetFootnoteDefinitions?: () => FootnoteDefinition[] | undefined
}

export class AssetResolverMarkdown
  implements IAssetPlugin, IAssetResolverPlugin, IAssetParsePlugin, IAssetPolishPlugin
{
  public readonly displayName: string = '@guanghechen/asset-resolver-markdown'
  protected readonly ctx: IMarkdownResolverPluginContext
  protected readonly frontmatterRegex: RegExp
  private readonly _resolveMiddlewares: IAssetPluginResolveMiddlewares
  private readonly _parseMiddlewares: IAssetPluginParseMiddlewares
  private readonly _polishMiddlewares: IAssetPluginPolishMiddlewares

  constructor(props: IProps) {
    const parser: IParser = props.parser
    const getPresetDefinitions: IMarkdownResolverPluginContext['getPresetDefinitions'] =
      props.getPresetDefinitions ?? (() => undefined)
    const getPresetFootnoteDefinitions: IMarkdownResolverPluginContext['getPresetFootnoteDefinitions'] =
      props.getPresetFootnoteDefinitions ?? (() => undefined)
    const parseMarkdown: IMarkdownResolverPluginContext['parseMarkdown'] = content => {
      return parser.parse(content, {
        shouldReservePosition: false,
        presetDefinitions: getPresetDefinitions() ?? [],
        presetFootnoteDefinitions: getPresetFootnoteDefinitions() ?? [],
      })
    }
    const resolvable: IMarkdownResolverPluginContext['resolvable'] =
      props.resolvable ?? (src => /\.md$/.test(src))
    const ctx: IMarkdownResolverPluginContext = {
      getPresetDefinitions,
      getPresetFootnoteDefinitions,
      parseMarkdown,
      resolvable,
    }

    this.ctx = ctx
    this.frontmatterRegex = /^\s*[-]{3,}\n\s*([\s\S]*?)[-]{3,}\n/
    this._resolveMiddlewares = new AsyncMiddlewares()
    this._parseMiddlewares = new AsyncMiddlewares()
    this._polishMiddlewares = new AsyncMiddlewares()
  }

  public use(...markdownResolverPlugins: IMarkdownResolverPlugin[]): this {
    for (const markdownResolverPlugin of markdownResolverPlugins) {
      const plugin: IAssetResolverPlugin = markdownResolverPlugin(this.ctx)
      if (plugin.displayName) {
        if (plugin.resolve) {
          const middleware: IAssetPluginResolveMiddleware = plugin.resolve.bind(plugin)
          this._resolveMiddlewares.use(middleware)
        }
        if (plugin.parse) {
          const middleware: IAssetPluginParseMiddleware = plugin.parse.bind(plugin)
          this._parseMiddlewares.use(middleware)
        }
        if (plugin.polish) {
          const middleware: IAssetPluginPolishMiddleware = plugin.polish.bind(plugin)
          this._polishMiddlewares.use(middleware)
        }
      }
    }
    return this
  }

  public readonly resolve: IAssetPluginResolveMiddleware = async (input, embryo, api, next) => {
    if (this.ctx.resolvable(input.src)) {
      const rawContent: string = input.content.toString(input.encoding)
      const match: string[] | null = this.frontmatterRegex.exec(rawContent) ?? ['', '']
      const frontmatter: Record<string, any> = match[1]
        ? (yaml.load(match[1]) as Record<string, any>)
        : {}
      const createdAt: string =
        frontmatter.createdAt != null ? dayjs(frontmatter.createdAt).toISOString() : input.createdAt
      const updatedAt: string =
        frontmatter.updatedAt != null ? dayjs(frontmatter.updatedAt).toISOString() : input.updatedAt
      const title: string = frontmatter.title
        ? collectTexts(this.ctx.parseMarkdown(frontmatter.title).children).join(' ') || input.title
        : input.title
      const sourcetype: string = MarkdownAssetType
      const mimetype: string = 'application/json'
      const uri: string | null = await api.resolveUri(sourcetype, mimetype)
      const slug: string | null = await api.resolveSlug({
        uri,
        slug: typeof frontmatter.slug === 'string' ? frontmatter.slug : null,
      })
      const result: IAssetPluginResolveOutput = {
        mimetype,
        sourcetype,
        slug,
        uri,
        title,
        description: frontmatter.description || title,
        createdAt,
        updatedAt,
        categories:
          Array.isArray(frontmatter.categories) &&
          frontmatter.categories.every(
            item => Array.isArray(item) && item.every(x => typeof x === 'string'),
          )
            ? frontmatter.categories
            : [],
        tags:
          Array.isArray(frontmatter.tags) && frontmatter.tags.every(x => typeof x === 'string')
            ? frontmatter.tags
            : [],
      }

      const reducer: IAssetPluginResolveNext = this._resolveMiddlewares.reducer(input, api)
      return reducer(result)
    }
    return next(embryo)
  }

  public readonly parse: IAssetPluginParseMiddleware = async (input, embryo, api, next) => {
    if (input.sourcetype === MarkdownAssetType) {
      const rawContent: string = input.content.toString(input.encoding)
      const match: string[] | null = this.frontmatterRegex.exec(rawContent) ?? ['', '']
      const frontmatter: Record<string, any> = match[1]
        ? (yaml.load(match[1]) as Record<string, any>)
        : {}
      const titleAst: Root = this.ctx.parseMarkdown(frontmatter.title || input.title)
      const title: Paragraph =
        titleAst.children.length === 1 && titleAst.children[0].type === ParagraphType
          ? (titleAst.children[0] as Paragraph)
          : { type: ParagraphType, children: collectInlineNodes(titleAst) }
      const ast: Root = this.ctx.parseMarkdown(rawContent.slice(match[0].length))
      const result: IAssetPluginParseOutput<IMarkdownParsedData> = {
        data: { title, ast, frontmatter },
      }

      const reducer: IAssetPluginParseNext = this._parseMiddlewares.reducer(input, api)
      return reducer(result)
    }
    return next(embryo)
  }

  public readonly polish: IAssetPluginPolishMiddleware = async (input, embryo, api, next) => {
    if (isMarkdownAssetPolishInput(input) && input.data) {
      const ast: Root = await shallowMutateAstInPreorderAsync(
        input.data.ast,
        o => (o as unknown as Resource).url !== undefined,
        async node => {
          const n = node as unknown as Resource
          const p: string | null = api.parseSrcPathFromUrl(n.url)
          if (!p) return node

          const refPath: string | null = await api.resolveRefPath(p)
          if (refPath === null) return node

          const asset: IAsset | null = await api.resolveAsset(refPath)
          if (asset) {
            const url: string = asset.slug || asset.uri
            return n.url === url ? node : { ...node, url }
          }
          return node
        },
      )

      const { frontmatter, title } = input.data
      const result: IAssetPluginPolishOutput<IMarkdownPolishedData> = {
        datatype: AssetDataTypeEnum.JSON,
        data: { title, ast, frontmatter },
      }

      const reducer: IAssetPluginPolishNext = this._polishMiddlewares.reducer(input, api)
      return reducer(result)
    }
    return next(embryo)
  }
}
