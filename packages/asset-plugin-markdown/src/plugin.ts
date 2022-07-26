import type {
  IAssetPlugin,
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetPluginResolveApi,
  IAssetPluginResolveInput,
  IAssetPluginResolveNext,
  IAssetPluginResolveOutput,
} from '@guanghechen/asset-core-service'
import { AssetDataType } from '@guanghechen/asset-core-service'
import { isArrayOfT, isString, isTwoDimensionArrayOfT } from '@guanghechen/option-helper'
import type { Resource, Root } from '@yozora/ast'
import { shallowMutateAstInPreorder } from '@yozora/ast-util'
import type { IParser } from '@yozora/core-parser'
import YozoraParser from '@yozora/parser'
import dayjs from 'dayjs'
import yaml from 'js-yaml'
import type { IMarkdownPolishedData, IMarkdownResolvedData } from './types'
import { MarkdownAssetType, isMarkdownAsset } from './types'

export interface IMarkdownAssetPluginProps {
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
  resolvable?: (filename: string) => boolean
}

export class MarkdownAssetPlugin implements IAssetPlugin {
  public readonly displayName: string = '@guanghechen/asset-plugin-markdown'
  protected readonly encoding: BufferEncoding
  protected readonly parser: IParser
  protected readonly frontmatterRegex: RegExp = /^\s*[-]{3,}\n\s*([\s\S]*?)[-]{3,}\n/
  protected readonly resolvable: (filename: string) => boolean

  constructor(props: IMarkdownAssetPluginProps = {}) {
    this.parser =
      props.parser ?? new YozoraParser({ defaultParseOptions: { shouldReservePosition: false } })
    this.encoding = props.encoding ?? 'utf8'
    this.resolvable = props.resolvable ?? (filename => /\.md$/.test(filename))
  }

  public async resolve(
    input: Readonly<IAssetPluginResolveInput>,
    embryo: Readonly<IAssetPluginResolveOutput> | null,
    api: Readonly<IAssetPluginResolveApi>,
    next: IAssetPluginResolveNext,
  ): Promise<IAssetPluginResolveOutput | null> {
    if (this.resolvable(input.filename) && input.content) {
      const rawContent = input.content.toString(this.encoding)
      const match: string[] | null = this.frontmatterRegex.exec(rawContent) ?? ['', '']
      const meta: Record<string, any> = match[1] ? (yaml.load(match[1]) as Record<string, any>) : {}
      const createdAt: string =
        meta.createdAt != null ? dayjs(meta.createdAt).toISOString() : input.createdAt
      const updatedAt: string =
        meta.updatedAt != null ? dayjs(meta.updatedAt).toISOString() : input.updatedAt
      const ast: Root = this.parser.parse(rawContent.slice(match[0].length))
      const result: IAssetPluginResolveOutput<IMarkdownResolvedData> = {
        type: MarkdownAssetType,
        mimetype: 'application/json',
        title: meta.title || input.title,
        slug: api.resolveSlug(meta.slug || undefined),
        createdAt,
        updatedAt,
        categories: isTwoDimensionArrayOfT(meta.categories, isString) ? meta.categories : [],
        tags: isArrayOfT(meta.tags, isString) ? meta.tags : [],
        data: { ast },
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
      const { ast } = input.data
      const resolvedAst = shallowMutateAstInPreorder(ast, null, node => {
        const n = node as unknown as Resource
        if (n.url && /^\./.test(n.url)) {
          const asset = api.resolveAsset(n.url)
          if (asset) return { ...node, url: asset.slug || asset.uri }
        }
        return node
      })

      const result: IAssetPluginPolishOutput<IMarkdownPolishedData> = {
        dataType: AssetDataType.JSON,
        data: { ast: resolvedAst },
        encoding: 'utf8',
      }
      return next(result)
    }
    return next(embryo)
  }
}
