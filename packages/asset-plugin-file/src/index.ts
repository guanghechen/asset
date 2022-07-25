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
import { AssetDataType, normalizePattern } from '@guanghechen/asset-core-service'
import path from 'path'

export const AssetFileType = 'file'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type AssetFileType = typeof AssetFileType

export interface IAssetFileData {
  srcLocation: string
}

/**
 * Props for building AssetFileProcessor
 */
export interface IAssetPluginFileProps {
  /**
   * Display name.
   */
  displayName?: string
  /**
   * If true, wait for other plugins to finish processing first.
   * @default true
   */
  useAsFallback?: boolean
  /**
   * If true (and the .rejected(src) is false), the input file is processable.
   * @default () => true
   */
  accepted?: RegExp[] | RegExp | ((src: string) => boolean)
  /**
   * If true, the input file is not processable.
   * @default () => false
   */
  rejected?: RegExp[] | RegExp | ((src: string) => boolean)
}

/**
 * Processor for handle file asset
 */
export class AssetPluginFile implements IAssetPlugin {
  public readonly displayName: string
  protected readonly useAsFallback: boolean
  protected readonly accepted: (src: string) => boolean
  protected readonly rejected: (src: string) => boolean

  constructor(props: IAssetPluginFileProps) {
    this.displayName = props.displayName ?? 'AssetPluginFile'
    this.useAsFallback = props.useAsFallback ?? true
    this.accepted = normalizePattern(props.accepted) ?? (() => true)
    this.rejected = normalizePattern(props.rejected) ?? (() => false)
  }

  public async resolve(
    embryo: IAssetPluginResolveInput,
    api: IAssetPluginResolveApi,
    next: IAssetPluginResolveNext,
  ): Promise<IAssetPluginResolveOutput | null> {
    if (this.useAsFallback) {
      const result = await next(embryo)
      if (result !== null) return result
    }

    if (this.accepted(embryo.src) && !this.rejected(embryo.src)) {
      const { name: title, ext: extname } = path.parse(embryo.filename)
      return {
        type: AssetFileType,
        mimetype: 'application/file',
        title,
        extname,
        slug: null,
        createdAt: embryo.createdAt,
        updatedAt: embryo.updatedAt,
        categories: [],
        tags: [],
        data: {
          srcLocation: embryo.src,
        },
      }
    }

    return this.useAsFallback ? null : next(embryo)
  }

  public async polish(
    embryo: IAssetPluginPolishInput,
    api: IAssetPluginPolishApi,
    next: IAssetPluginPolishNext,
  ): Promise<IAssetPluginPolishOutput | null> {
    if (embryo.type === AssetFileType) {
      const { srcLocation } = embryo.data as IAssetFileData
      const content = api.loadContent(srcLocation)
      return { dataType: AssetDataType.BINARY, data: content }
    }
    return next(embryo)
  }
}
