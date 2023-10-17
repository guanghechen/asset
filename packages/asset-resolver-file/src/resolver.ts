import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import type {
  IAssetPlugin,
  IAssetPluginPolishMiddleware,
  IAssetPluginResolveMiddleware,
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

  public readonly resolve: IAssetPluginResolveMiddleware = async (input, embryo, api, next) => {
    if (!embryo && this.resolvable(input.src)) {
      const sourcetype: string = FileAssetType
      const mimetype: string = mime.getType(input.src) ?? 'unknown'
      const uri: string | null = await api.resolveUri(sourcetype, mimetype)
      const result: IAssetPluginResolveOutput = {
        mimetype,
        sourcetype,
        slug: null,
        uri,
        title: input.title,
        description: null,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
        categories: [],
        tags: [],
      }
      return next(result)
    }
    return next(embryo)
  }

  public readonly polish: IAssetPluginPolishMiddleware = async (input, embryo, _api, next) => {
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
