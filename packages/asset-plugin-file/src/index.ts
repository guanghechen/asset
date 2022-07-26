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

  constructor(props: IAssetPluginFileProps = {}) {
    this.displayName = props.displayName ?? '@guanghechen/asset-plugin-file'
    this.useAsFallback = props.useAsFallback ?? true
    this.accepted = normalizePattern(props.accepted) ?? (() => true)
    this.rejected = normalizePattern(props.rejected) ?? (() => false)
  }

  public async resolve(
    input: Readonly<IAssetPluginResolveInput>,
    embryo: Readonly<IAssetPluginResolveOutput> | null,
    api: Readonly<IAssetPluginResolveApi>,
    next: IAssetPluginResolveNext,
  ): Promise<IAssetPluginResolveOutput | null> {
    const resolve = (): IAssetPluginResolveOutput | null => {
      if (this.accepted(input.src) && !this.rejected(input.src)) {
        const { name: title, ext: extname } = path.parse(input.filename)
        const data: IAssetFileData = { srcLocation: input.src }

        return {
          type: AssetFileType,
          mimetype: 'application/file',
          title,
          extname,
          slug: null,
          createdAt: input.createdAt,
          updatedAt: input.updatedAt,
          categories: [],
          tags: [],
          data,
        }
      }
      return null
    }

    if (this.useAsFallback) {
      const result = (await next(embryo)) ?? embryo
      if (result !== null) return result
      return resolve()
    }

    const embryo2 = embryo ?? resolve()
    return next(embryo2) ?? embryo2
  }

  public async polish(
    input: Readonly<IAssetPluginPolishInput>,
    embryo: Readonly<IAssetPluginPolishOutput> | null,
    api: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): Promise<IAssetPluginPolishOutput | null> {
    if (input.type === AssetFileType) {
      const { srcLocation } = input.data as IAssetFileData
      const content = api.loadContent(srcLocation)
      const result = { dataType: AssetDataType.BINARY, data: content }
      return next(result) ?? result
    }
    return next(embryo)
  }
}
