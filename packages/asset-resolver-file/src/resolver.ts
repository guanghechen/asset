import { AssetDataTypeEnum } from '@guanghechen/asset-types'
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
  IAssetPolishPlugin,
  IAssetResolvePlugin,
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

export class AssetResolverFile implements IAssetPlugin, IAssetResolvePlugin, IAssetPolishPlugin {
  public readonly displayName: string
  protected readonly resolvable: (src: string) => boolean

  constructor(props: IAssetResolverFileProps = {}) {
    this.displayName = props.displayName ?? '@guanghechen/asset-resolver-file'
    const accepted = normalizePattern(props.accepted) ?? (() => true)
    const rejected = normalizePattern(props.rejected) ?? (() => false)
    this.resolvable = (src: string): boolean => accepted(src) && !rejected(src)
  }

  public async resolve(
    input: Readonly<IAssetPluginResolveInput>,
    embryo: Readonly<IAssetPluginResolveOutput> | null,
    api: Readonly<IAssetPluginResolveApi>,
    next: IAssetPluginResolveNext,
  ): Promise<IAssetPluginResolveOutput | null> {
    if (!embryo && this.resolvable(input.src)) {
      const sourcetype: string = FileAssetType
      const mimetype: string = mime.getType(input.src) ?? 'unknown'
      const uri: string | null = await api.resolveUri(sourcetype, mimetype)
      const result: IAssetPluginResolveOutput = {
        sourcetype,
        mimetype,
        description: null,
        slug: null,
        uri,
        title: input.title,
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
    api_: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): Promise<IAssetPluginPolishOutput | null> {
    if (isFileAssetPolishInput(input)) {
      const result: IFileAssetPolishOutput = {
        datatype: AssetDataTypeEnum.BINARY,
        data: input.content,
      }
      return next(result)
    }
    return next(embryo)
  }
}
