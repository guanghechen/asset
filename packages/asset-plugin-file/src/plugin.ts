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
import type { IFilePolishedData, IFileResolvedData } from './types'
import { FileAssetType, isFileAsset } from './types'

export interface IFileAssetPluginProps {
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

export class FileAssetPlugin implements IAssetPlugin {
  public readonly displayName: string
  protected readonly accepted: (src: string) => boolean
  protected readonly rejected: (src: string) => boolean

  constructor(props: IFileAssetPluginProps = {}) {
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
      const mimetype = mime.getType(input.filename)
      const result: IAssetPluginResolveOutput<IFileResolvedData> = {
        type: FileAssetType,
        mimetype: mimetype ?? 'unknown',
        title: input.title,
        slug: null,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
        categories: [],
        tags: [],
        data: { srcLocation: input.src },
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
    if (isFileAsset(input) && input.data) {
      const { srcLocation } = input.data
      const content: Buffer | null = await api.loadContent(srcLocation)
      if (content !== null) {
        const result: IAssetPluginPolishOutput<IFilePolishedData> = {
          dataType: AssetDataType.BINARY,
          data: content,
        }
        return next(result)
      }
    }
    return next(embryo)
  }
}
