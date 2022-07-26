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
import mime from 'mime'

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
  protected readonly accepted: (src: string) => boolean
  protected readonly rejected: (src: string) => boolean

  constructor(props: IAssetPluginFileProps = {}) {
    this.displayName = props.displayName ?? '@guanghechen/asset-plugin-file'
    this.accepted = normalizePattern(props.accepted) ?? (() => true)
    this.rejected = normalizePattern(props.rejected) ?? (() => false)
  }

  public async resolve(
    input: Readonly<IAssetPluginResolveInput>,
    embryo: Readonly<IAssetPluginResolveOutput> | null,
    api: Readonly<IAssetPluginResolveApi>,
    next: IAssetPluginResolveNext,
  ): Promise<IAssetPluginResolveOutput | null> {
    if (!embryo && this.accepted(input.src) && !this.rejected(input.src)) {
      const data: IAssetFileData = { srcLocation: input.src }
      const mimetype = mime.getType(input.filename)

      return next({
        type: AssetFileType,
        mimetype: mimetype ?? 'unknown',
        title: input.title,
        slug: null,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
        categories: [],
        tags: [],
        data,
      })
    }
    return next(embryo)
  }

  public async polish(
    input: Readonly<IAssetPluginPolishInput>,
    embryo: Readonly<IAssetPluginPolishOutput> | null,
    api: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): Promise<IAssetPluginPolishOutput | null> {
    if (input.type === AssetFileType) {
      const { srcLocation } = input.data as IAssetFileData
      const content: Buffer = await api.loadContent(srcLocation)
      const result = { dataType: AssetDataType.BINARY, data: content }
      return next(result)
    }
    return next(embryo)
  }
}
