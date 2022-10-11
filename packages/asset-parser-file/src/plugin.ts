import { AssetDataType } from '@guanghechen/asset-core'
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
import { normalizePattern } from '@guanghechen/asset-core-parser'
import mime from 'mime'
import type { IFilePolishedData, IFileResolvedData } from './types'
import { FileAssetType, isFileAsset } from './types'

export interface IFileAssetParserProps {
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

export class FileAssetParser implements IAssetPlugin {
  public readonly displayName: string
  protected readonly accepted: (src: string) => boolean
  protected readonly rejected: (src: string) => boolean

  constructor(props: IFileAssetParserProps = {}) {
    this.displayName = props.displayName ?? '@guanghechen/asset-parser-file'
    this.accepted = normalizePattern(props.accepted) ?? (() => true)
    this.rejected = normalizePattern(props.rejected) ?? (() => false)
  }

  public async parse(
    input: Readonly<IAssetPluginParseInput>,
    embryo: Readonly<IAssetPluginParseOutput> | null,
    api: Readonly<IAssetPluginParseApi>,
    next: IAssetPluginParseNext,
  ): Promise<IAssetPluginParseOutput | null> {
    if (!embryo && this.accepted(input.src) && !this.rejected(input.src)) {
      const mimetype = mime.getType(input.filename)
      const result: IAssetPluginParseOutput<IFileResolvedData> = {
        type: FileAssetType,
        mimetype: mimetype ?? 'unknown',
        title: input.title,
        description: null,
        slug: null,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
        categories: [],
        tags: [],
        data: { filename: input.filename },
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
      const { filename } = input.data
      const content: Buffer | null = await api.loadContent(filename)
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
