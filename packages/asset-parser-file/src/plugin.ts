import type {
  IAssetParserPlugin,
  IAssetParserPluginParseApi,
  IAssetParserPluginParseInput,
  IAssetParserPluginParseNext,
  IAssetParserPluginParseOutput,
  IAssetParserPluginPolishApi,
  IAssetParserPluginPolishInput,
  IAssetParserPluginPolishNext,
  IAssetParserPluginPolishOutput,
} from '@guanghechen/asset-core-parser'
import { AssetDataType, normalizePattern } from '@guanghechen/asset-core-parser'
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

export class FileAssetParser implements IAssetParserPlugin {
  public readonly displayName: string
  protected readonly accepted: (src: string) => boolean
  protected readonly rejected: (src: string) => boolean

  constructor(props: IFileAssetParserProps = {}) {
    this.displayName = props.displayName ?? '@guanghechen/asset-parser-file'
    this.accepted = normalizePattern(props.accepted) ?? (() => true)
    this.rejected = normalizePattern(props.rejected) ?? (() => false)
  }

  public async parse(
    input: Readonly<IAssetParserPluginParseInput>,
    embryo: Readonly<IAssetParserPluginParseOutput> | null,
    api: Readonly<IAssetParserPluginParseApi>,
    next: IAssetParserPluginParseNext,
  ): Promise<IAssetParserPluginParseOutput | null> {
    if (!embryo && this.accepted(input.src) && !this.rejected(input.src)) {
      const mimetype = mime.getType(input.filename)
      const result: IAssetParserPluginParseOutput<IFileResolvedData> = {
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
    input: Readonly<IAssetParserPluginPolishInput>,
    embryo: Readonly<IAssetParserPluginPolishOutput> | null,
    api: Readonly<IAssetParserPluginPolishApi>,
    next: IAssetParserPluginPolishNext,
  ): Promise<IAssetParserPluginPolishOutput | null> {
    if (isFileAsset(input) && input.data) {
      const { srcLocation } = input.data
      const content: Buffer | null = await api.loadContent(srcLocation)
      if (content !== null) {
        const result: IAssetParserPluginPolishOutput<IFilePolishedData> = {
          dataType: AssetDataType.BINARY,
          data: content,
        }
        return next(result)
      }
    }
    return next(embryo)
  }
}
