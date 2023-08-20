import { AssetDataType } from '@guanghechen/asset-types'
import type {
  IAssetPluginLocateApi,
  IAssetPluginLocateInput,
  IAssetPluginLocateNext,
  IAssetPluginLocateOutput,
  IAssetPluginParseApi,
  IAssetPluginParseInput,
  IAssetPluginParseNext,
  IAssetPluginParseOutput,
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetResolverPlugin,
} from '@guanghechen/asset-types'
import { isArrayOfT, isString, isTwoDimensionArrayOfT } from '@guanghechen/helper-is'
import type { Resource, Root } from '@yozora/ast'
import { shallowMutateAstInPreorder } from '@yozora/ast-util'
import type { IParser } from '@yozora/core-parser'
import { YozoraParser } from '@yozora/parser'
import dayjs from 'dayjs'
import yaml from 'js-yaml'
import type { IMarkdownPolishedData, IMarkdownResolvedData } from './types'
import { MarkdownAssetType, isMarkdownAssetPolishInput } from './types'

export interface IAssetResolverMarkdownProps {
  /**
   * Encoding of markdown files.
   * @default 'utf8'
   */
  encoding?: BufferEncoding
  /**
   * Markdown parser.
   */
  parser?: IParser
  /**
   * Check if the given file is in markdown format.
   * @default filename => /\.md$/.test(filename)
   */
  resolvable?(filename: string): boolean
}

export class AssetResolverMarkdown implements IAssetResolverPlugin {
  public readonly displayName: string = '@guanghechen/asset-resolver-markdown'
  protected readonly encoding: BufferEncoding
  protected readonly parser: IParser
  protected readonly frontmatterRegex: RegExp = /^\s*[-]{3,}\n\s*([\s\S]*?)[-]{3,}\n/
  protected readonly resolvable: (filename: string) => boolean

  constructor(props: IAssetResolverMarkdownProps = {}) {
    this.parser =
      props.parser ?? new YozoraParser({ defaultParseOptions: { shouldReservePosition: false } })
    this.encoding = props.encoding ?? 'utf8'
    this.resolvable = props.resolvable ?? (filename => /\.md$/.test(filename))
  }

  public async locate(
    input: Readonly<IAssetPluginLocateInput>,
    embryo: Readonly<IAssetPluginLocateOutput> | null,
    api: Readonly<IAssetPluginLocateApi>,
    next: IAssetPluginLocateNext,
  ): Promise<IAssetPluginLocateOutput | null> {
    if (this.resolvable(input.filename)) {
      const rawSrcContent: Buffer | null = await api.loadContent(input.filename)
      if (rawSrcContent) {
        const rawContent = rawSrcContent.toString(this.encoding)
        const match: string[] | null = this.frontmatterRegex.exec(rawContent) ?? ['', '']
        const frontmatter: Record<string, any> = match[1]
          ? (yaml.load(match[1]) as Record<string, any>)
          : {}
        const createdAt: string =
          frontmatter.createdAt != null
            ? dayjs(frontmatter.createdAt).toISOString()
            : input.createdAt
        const updatedAt: string =
          frontmatter.updatedAt != null
            ? dayjs(frontmatter.updatedAt).toISOString()
            : input.updatedAt
        const title: string = frontmatter.title || input.title
        const type: string = MarkdownAssetType
        const mimetype = 'application/json'
        const uri = api.resolveUri(type, mimetype)
        const result: IAssetPluginLocateOutput = {
          type,
          mimetype,
          title,
          description: frontmatter.description || title,
          slug: api.resolveSlug(frontmatter.slug || undefined),
          uri,
          createdAt,
          updatedAt,
          categories: isTwoDimensionArrayOfT(frontmatter.categories, isString)
            ? frontmatter.categories
            : [],
          tags: isArrayOfT(frontmatter.tags, isString) ? frontmatter.tags : [],
        }
        return next(result)
      }
    }
    return next(embryo)
  }

  public async parse(
    input: Readonly<IAssetPluginParseInput>,
    embryo: Readonly<IAssetPluginParseOutput> | null,
    api: Readonly<IAssetPluginParseApi>,
    next: IAssetPluginParseNext,
  ): Promise<IAssetPluginParseOutput | null> {
    if (input.type === MarkdownAssetType) {
      const rawSrcContent: Buffer | null = await api.loadContent(input.filename)
      if (rawSrcContent) {
        const rawContent = rawSrcContent.toString(this.encoding)
        const match: string[] | null = this.frontmatterRegex.exec(rawContent) ?? ['', '']
        const frontmatter: Record<string, any> = match[1]
          ? (yaml.load(match[1]) as Record<string, any>)
          : {}
        const ast: Root = this.parser.parse(rawContent.slice(match[0].length))
        const result: IAssetPluginParseOutput<IMarkdownResolvedData> = {
          data: {
            ast,
            frontmatter,
          },
        }
        return next(result)
      }
    }
    return next(embryo)
  }

  public async polish(
    input: Readonly<IAssetPluginPolishInput>,
    embryo: Readonly<IAssetPluginPolishOutput> | null,
    api: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): Promise<IAssetPluginPolishOutput | null> {
    if (isMarkdownAssetPolishInput(input) && input.data) {
      const ast = shallowMutateAstInPreorder(input.data.ast, null, node => {
        const n = node as unknown as Resource
        if (n.url && /^\./.test(n.url)) {
          const asset = api.resolveAsset(n.url)
          if (asset) return { ...node, url: asset.slug || asset.uri }
        }
        return node
      })

      const { frontmatter } = input.data
      const result: IAssetPluginPolishOutput<IMarkdownPolishedData> = {
        dataType: AssetDataType.JSON,
        data: {
          ast,
          frontmatter,
        },
        encoding: 'utf8',
      }
      return next(result)
    }
    return next(embryo)
  }
}
