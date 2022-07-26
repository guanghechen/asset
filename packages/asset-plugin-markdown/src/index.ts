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
import path from 'path'

export const AssetMarkdownType = 'markdown'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AssetMarkdownType = typeof AssetMarkdownType

export interface IAssetMarkdownData {
  /**
   * Markdown ast.
   */
  ast: Root
}

/**
 * Props for building AssetMarkdownProcessor
 */
export interface IAssetPluginMarkdownProps {
  /**
   * Display name.
   */
  displayName?: string
  /**
   * Encoding of markdown files.
   * @default 'utf8'
   */
  encoding?: BufferEncoding
  /**
   * File extensions to recognized as Markdown type file.
   * @default ['.md']
   */
  extensions?: string[]
  /**
   * Markdown parser.
   */
  parser?: IParser
}

/**
 * Processor for handle markdown asset
 */
export class AssetPluginMarkdown implements IAssetPlugin {
  public readonly displayName: string
  protected readonly encoding: BufferEncoding
  protected readonly extensions: string[]
  protected readonly parser: IParser
  protected readonly frontmatterRegex: RegExp = /^\s*[-]{3,}\n\s*([\s\S]*?)[-]{3,}\n/

  constructor(props: IAssetPluginMarkdownProps = {}) {
    this.displayName = props.displayName ?? '@guanghechen/asset-plugin-markdown'
    this.parser =
      props.parser ?? new YozoraParser({ defaultParseOptions: { shouldReservePosition: false } })
    this.encoding = props.encoding ?? 'utf8'
    this.extensions = props.extensions ? props.extensions.slice() : ['.md']
  }

  public async resolve(
    input: Readonly<IAssetPluginResolveInput>,
    embryo: Readonly<IAssetPluginResolveOutput> | null,
    api: Readonly<IAssetPluginResolveApi>,
    next: IAssetPluginResolveNext,
  ): Promise<IAssetPluginResolveOutput | null> {
    const { name: title, ext: extname } = path.parse(input.filename)
    if (this.extensions.includes(extname) && input.content) {
      const rawContent = input.content.toString(this.encoding)
      const match: string[] | null = this.frontmatterRegex.exec(rawContent) ?? ['', '']
      const meta: Record<string, any> = match[1] ? (yaml.load(match[1]) as Record<string, any>) : {}
      const createdAt: string =
        meta.createdAt != null ? dayjs(meta.createdAt).toISOString() : input.createdAt
      const updatedAt: string =
        meta.updatedAt != null ? dayjs(meta.updatedAt).toISOString() : input.updatedAt
      const ast: Root = this.parser.parse(rawContent.slice(match[0].length))
      const data: IAssetMarkdownData = { ast }
      const result: IAssetPluginResolveOutput = {
        type: AssetMarkdownType,
        mimetype: 'application/json',
        title: meta.title || title,
        extname: '.json',
        slug: api.resolveSlug(meta.slug || undefined),
        createdAt,
        updatedAt,
        categories: isTwoDimensionArrayOfT(meta.categories, isString) ? meta.categories : [],
        tags: isArrayOfT(meta.tags, isString) ? meta.tags : [],
        data,
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
    if (input.type === AssetMarkdownType) {
      const { ast } = input.data as IAssetMarkdownData
      const resolvedAst = shallowMutateAstInPreorder(ast, null, node => {
        const n = node as unknown as Resource
        if (n.url && /^\./.test(n.url)) {
          const asset = api.resolveAsset(n.url)
          if (asset) return { ...node, url: asset.slug || asset.uri }
        }
        return node
      })

      const result = {
        dataType: AssetDataType.JSON,
        data: { ast: resolvedAst },
        encoding: this.encoding,
      }
      return next(result)
    }
    return next(embryo)
  }
}
