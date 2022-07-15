import type {
  IAssetProcessingMiddleware,
  IBuffer,
  IMiddlewarePostProcessContext,
  IMiddlewarePostProcessEmbryo,
  IMiddlewarePostProcessNext,
  IMiddlewareProcessContext,
  IMiddlewareProcessEmbryo,
  IMiddlewareProcessNext,
} from '@guanghechen/asset-core-service'
import { AssetType, isArrayOfT, isTwoDimensionArrayOfT } from '@guanghechen/asset-core-service'
import { isString } from '@guanghechen/option-helper'
import type { Root } from '@yozora/ast'
import type { IParser } from '@yozora/core-parser'
import YozoraParser from '@yozora/parser'
import dayjs from 'dayjs'
import yaml from 'js-yaml'
import { AssetMarkdownType } from './entity'

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
export class AssetPluginMarkdown implements IAssetProcessingMiddleware {
  public readonly displayName: string
  protected readonly encoding: BufferEncoding
  protected readonly extensions: string[]
  protected readonly parser: IParser
  protected readonly frontmatterRegex: RegExp = /^\s*[-]{3,}\n\s*([\s\S]*?)[-]{3,}\n/

  constructor(props: IAssetPluginMarkdownProps) {
    this.displayName = props.displayName ?? 'AssetPluginMarkdown'
    this.parser =
      props.parser ?? new YozoraParser({ defaultParseOptions: { shouldReservePosition: false } })
    this.encoding = props.encoding ?? 'utf8'
    this.extensions = props.extensions ? props.extensions.slice() : ['.md']
  }

  public async process(
    ctx: IMiddlewareProcessContext,
    next: IMiddlewareProcessNext,
  ): Promise<IMiddlewareProcessEmbryo> {
    const { embryo, resolveSlug } = ctx
    if (embryo.type === AssetType.FILE && this.extensions.includes(embryo.extname) && embryo.data) {
      const rawContent = (embryo.data as IBuffer).toString(this.encoding)
      const match: string[] | null = this.frontmatterRegex.exec(rawContent) ?? ['', '']
      const meta: Record<string, any> = match[1] ? (yaml.load(match[1]) as Record<string, any>) : {}
      const createdAt: string =
        meta.createdAt != null ? dayjs(meta.createdAt).toISOString() : embryo.createdAt
      const updatedAt: string =
        meta.updatedAt != null ? dayjs(meta.updatedAt).toISOString() : embryo.updatedAt
      const ast: Root = this.parser.parse(rawContent.slice(match[1].length))
      return {
        ...embryo,
        type: AssetMarkdownType,
        extname: '.json',
        slug: resolveSlug(meta.slug || undefined),
        title: meta.title || embryo.title,
        data: ast,
        createdAt,
        updatedAt,
        categories: isTwoDimensionArrayOfT(meta.categories, isString) ? meta.categories : [],
        tags: isArrayOfT(meta.tags, isString) ? meta.tags : [],
      }
    }
    return await next(ctx)
  }

  public async postProcess(
    ctx: IMiddlewarePostProcessContext,
    next: IMiddlewarePostProcessNext,
  ): Promise<IMiddlewarePostProcessEmbryo> {
    const { embryo } = ctx
    if (embryo.type !== AssetMarkdownType) return next(ctx)
    // TODO: resolve reference urls.
    return embryo
  }
}
