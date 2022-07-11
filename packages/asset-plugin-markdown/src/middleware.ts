import type { IRawAsset } from '@guanghechen/asset-core'
import { AssetType } from '@guanghechen/asset-core'
import type {
  IAssetEntity,
  IAssetMiddleware,
  IProcessAssetContext,
  IProcessAssetNext,
  IProcessEntityContext,
  IProcessEntityNext,
} from '@guanghechen/asset-core-service'
import type { Root } from '@yozora/ast'
import type { IParser } from '@yozora/core-parser'
import YozoraParser from '@yozora/parser'
import dayjs from 'dayjs'
import yaml from 'js-yaml'
import { AssetMarkdownType } from './entity'

const ERROR_TITLE = '[AssetPluginMarkdown]'

/**
 * Props for building AssetMarkdownProcessor
 */
export interface IAssetPluginMarkdownProps {
  /**
   * Markdown parser.
   */
  parser: IParser
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
}

/**
 * Processor for handle markdown asset
 */
export class AssetPluginMarkdown implements IAssetMiddleware {
  protected readonly parser: IParser
  protected readonly encoding: BufferEncoding
  protected readonly extensions: string[]
  protected readonly frontmatterRegex: RegExp = /^\s*[-]{3,}\n\s*([\s\S]*?)[-]{3,}\n/

  constructor(props: IAssetPluginMarkdownProps) {
    this.parser =
      props.parser ?? new YozoraParser({ defaultParseOptions: { shouldReservePosition: false } })
    this.encoding = props.encoding ?? 'utf8'
    this.extensions = [...(props.extensions ?? ['.md'])]
  }

  public async processAsset(
    ctx: IProcessAssetContext,
    next: IProcessAssetNext,
  ): Promise<IRawAsset> {
    const { rawAsset } = ctx
    const { encoding, extensions } = this
    if (rawAsset.type !== AssetType.FILE || !extensions.includes(rawAsset.extname)) return next(ctx)

    try {
      const rawContent = (await ctx.loadContent()).toString(encoding)
      const match: string[] | null = this.frontmatterRegex.exec(rawContent) ?? ['', '']
      const meta: Record<string, any> = match[1] ? (yaml.load(match[1]) as Record<string, any>) : {}

      const createdAt: string =
        meta.createdAt != null ? dayjs(meta.createdAt).toISOString() : rawAsset.createdAt
      const updatedAt: string =
        meta.updatedAt != null ? dayjs(meta.updatedAt).toISOString() : rawAsset.updatedAt

      return {
        ...rawAsset,
        type: AssetMarkdownType,
        extname: '.json',
        createdAt,
        updatedAt,
        title: meta.title || rawAsset.title,
        slug: ctx.resolveSlug(meta.slug || undefined),
      }
    } catch (error) {
      console.error(ERROR_TITLE, 'processAsset:', error)
      return next(ctx)
    }
  }

  public async processEntity(
    ctx: IProcessEntityContext,
    next: IProcessEntityNext,
  ): Promise<IAssetEntity> {
    const { asset } = ctx
    if (asset.type !== AssetMarkdownType) return next(ctx)

    try {
      const rawContent = (await ctx.loadContent()).toString(this.encoding)
      const match: string[] | null = this.frontmatterRegex.exec(rawContent) ?? ['', '']
      const ast: Root = this.parser.parse(rawContent.slice(match[1].length))
      return { data: { ast } }
    } catch (error) {
      console.error(ERROR_TITLE, 'processEntity:', error)
      return next(ctx)
    }
  }
}
