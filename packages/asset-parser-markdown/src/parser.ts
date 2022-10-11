import type {
  IAssetPlugin,
  IAssetPluginParseApi,
  IAssetPluginParseInput,
  IAssetPluginParseNext,
  IAssetPluginParseOutput,
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
} from '@guanghechen/asset-core-parser'
import { AssetDataType } from '@guanghechen/asset-core-parser'
import { isArrayOfT, isString, isTwoDimensionArrayOfT } from '@guanghechen/helper-is'
import type { Resource, Root } from '@yozora/ast'
import { shallowMutateAstInPreorder } from '@yozora/ast-util'
import type { IParser } from '@yozora/core-parser'
import { YozoraParser } from '@yozora/parser'
import dayjs from 'dayjs'
import yaml from 'js-yaml'
import type { IMarkdownPolishedData, IMarkdownResolvedData } from './types'
import { MarkdownAssetType, isMarkdownAsset } from './types'

export interface IMarkdownAssetParserProps {
  /**
   * Encoding of markdown files.
   * @default 'utf8'
   */
  encoding?: BufferEncoding
  /**
   * Markdown parser.
   */
  parser?: IParser
  readOptions?: {
    /**
     * the number of words read per minute
     */
    wordsPerMinute?: number
  }
  /**
   * Check if the given file is in markdown format.
   * @default filename => /\.md$/.test(filename)
   */
  resolvable?: (filename: string) => boolean
}

export class MarkdownAssetParser implements IAssetPlugin {
  public readonly displayName: string = '@guanghechen/asset-parser-markdown'
  protected readonly encoding: BufferEncoding
  protected readonly parser: IParser
  protected readonly frontmatterRegex: RegExp = /^\s*[-]{3,}\n\s*([\s\S]*?)[-]{3,}\n/
  protected readonly resolvable: (filename: string) => boolean

  constructor(props: IMarkdownAssetParserProps = {}) {
    this.parser =
      props.parser ?? new YozoraParser({ defaultParseOptions: { shouldReservePosition: false } })
    this.encoding = props.encoding ?? 'utf8'
    this.resolvable = props.resolvable ?? (filename => /\.md$/.test(filename))
  }

  public async parse(
    input: Readonly<IAssetPluginParseInput>,
    embryo: Readonly<IAssetPluginParseOutput> | null,
    api: Readonly<IAssetPluginParseApi>,
    next: IAssetPluginParseNext,
  ): Promise<IAssetPluginParseOutput | null> {
    if (this.resolvable(input.filename) && input.content) {
      const rawContent = input.content.toString(this.encoding)
      const match: string[] | null = this.frontmatterRegex.exec(rawContent) ?? ['', '']
      const frontmatter: Record<string, any> = match[1]
        ? (yaml.load(match[1]) as Record<string, any>)
        : {}
      const createdAt: string =
        frontmatter.createdAt != null ? dayjs(frontmatter.createdAt).toISOString() : input.createdAt
      const updatedAt: string =
        frontmatter.updatedAt != null ? dayjs(frontmatter.updatedAt).toISOString() : input.updatedAt
      const ast: Root = this.parser.parse(rawContent.slice(match[0].length))

      const title: string = frontmatter.title || input.title
      const result: IAssetPluginParseOutput<IMarkdownResolvedData> = {
        type: MarkdownAssetType,
        mimetype: 'application/json',
        title,
        description: frontmatter.description || title,
        slug: api.resolveSlug(frontmatter.slug || undefined),
        createdAt,
        updatedAt,
        categories: isTwoDimensionArrayOfT(frontmatter.categories, isString)
          ? frontmatter.categories
          : [],
        tags: isArrayOfT(frontmatter.tags, isString) ? frontmatter.tags : [],
        data: {
          ast,
          frontmatter,
        },
      }
      return next(result)
    }
    return next(embryo)
  }

  public async polish(
    input: Readonly<IAssetPluginPolishInput>,
    embryo: Readonly<IAssetPluginPolishOutput> | null,
    api: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): Promise<IAssetPluginPolishOutput | null> {
    if (isMarkdownAsset(input) && input.data) {
      const ast = shallowMutateAstInPreorder(input.data.ast, null, node => {
        const n = node as unknown as Resource
        if (n.url && /^\./.test(n.url)) {
          const asset = api.resolveAsset(n.url)
          if (asset) return { ...node, url: asset.slug || asset.uri }
        }
        return node
      })

      const { frontmatter, excerpt, toc, timeToRead } = {
        ...input.data,
        ...(embryo?.data as IMarkdownPolishedData),
      }
      const result: IAssetPluginPolishOutput<IMarkdownPolishedData> = {
        dataType: AssetDataType.JSON,
        data: {
          ast,
          frontmatter,
          excerpt,
          toc,
          timeToRead,
        },
        encoding: 'utf8',
      }
      return next(result)
    }
    return next(embryo)
  }
}
