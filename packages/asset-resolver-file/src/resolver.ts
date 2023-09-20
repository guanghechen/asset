import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import type {
  IAssetPluginLocateApi,
  IAssetPluginLocateInput,
  IAssetPluginLocateNext,
  IAssetPluginLocateOutput,
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetResolverPlugin,
  IBinaryFileData,
} from '@guanghechen/asset-types'
import { mime, normalizePattern } from '@guanghechen/asset-util'
import type { IFileAssetPolishOutput } from './types'
import { FileAssetType, isFileAssetPolishInput } from './types'

export interface IAssetResolverFileProps {
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

export class AssetResolverFile implements IAssetResolverPlugin {
  public readonly displayName: string
  protected readonly resolvable: (filename: string) => boolean

  constructor(props: IAssetResolverFileProps = {}) {
    this.displayName = props.displayName ?? '@guanghechen/asset-resolver-file'
    const accepted = normalizePattern(props.accepted) ?? (() => true)
    const rejected = normalizePattern(props.rejected) ?? (() => false)
    this.resolvable = (filename: string): boolean => accepted(filename) && !rejected(filename)
  }

  public async locate(
    input: Readonly<IAssetPluginLocateInput>,
    embryo: Readonly<IAssetPluginLocateOutput> | null,
    api: Readonly<IAssetPluginLocateApi>,
    next: IAssetPluginLocateNext,
  ): Promise<IAssetPluginLocateOutput | null> {
    if (!embryo && this.resolvable(input.src)) {
      const sourcetype: string = FileAssetType
      const mimetype: string = mime.getType(input.filename) ?? 'unknown'
      const uri: string | null = await api.resolveUri(sourcetype, mimetype)
      const result: IAssetPluginLocateOutput = {
        sourcetype,
        mimetype,
        title: input.title,
        description: null,
        slug: null,
        uri,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
        categories: [],
        tags: [],
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
    if (isFileAssetPolishInput(input)) {
      const content: IBinaryFileData | null = await api.loadContent(input.filename)
      if (content !== null) {
        const result: IFileAssetPolishOutput = {
          sourcetype: FileAssetType,
          datatype: AssetDataTypeEnum.BINARY,
          data: content,
        }
        return next(result)
      }
    }
    return next(embryo)
  }
}
