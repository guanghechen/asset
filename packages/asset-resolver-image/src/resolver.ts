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
  IAssetResolverPlugin,
  IBinaryFileData,
} from '@guanghechen/asset-types'
import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import { mime, normalizePattern } from '@guanghechen/asset-util'
import sizeOf from 'image-size'
import type { IImageAssetPolishOutput } from './types'
import { ImageAssetType, isImageAssetPolishInput } from './types'

export interface IAssetResolverImageProps {
  /**
   * Display name.
   */
  displayName?: string
  /**
   * If true (and the .rejected(src) is false), the input image is processable.
   * @default () => true
   */
  accepted?: RegExp[] | RegExp | ((src: string) => boolean)
  /**
   * If true, the input image is not processable.
   * @default () => false
   */
  rejected?: RegExp[] | RegExp | ((src: string) => boolean)
}

export class AssetResolverImage implements IAssetPlugin, IAssetResolverPlugin, IAssetPolishPlugin {
  public readonly displayName: string
  protected readonly accepted: (src: string) => boolean
  protected readonly rejected: (src: string) => boolean

  constructor(props: IAssetResolverImageProps = {}) {
    this.displayName = props.displayName ?? '@guanghechen/asset-resolver-image'
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
      const sourcetype: string = ImageAssetType
      const mimetype: string = mime.getType(input.src) ?? 'unknown'
      let uri: string | null = await api.resolveUri(sourcetype, mimetype)

      if (uri?.startsWith('/')) {
        try {
          const prefix = 'https://localhost'
          const urlObj = new URL(`${prefix}${uri}`)
          if (!urlObj.searchParams.has('width') || !urlObj.searchParams.has('height')) {
            const size = sizeOf(input.content)
            if (size.width && !urlObj.searchParams.has('width')) {
              urlObj.searchParams.set('width', String(size.width))
            }
            if (size.height && !urlObj.searchParams.has('height')) {
              urlObj.searchParams.set('height', String(size.height))
            }
            uri = urlObj.toString().slice(prefix.length)
          }
        } catch (error) {
          console.error(error)
        }
      }

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

  public async polish(
    input: Readonly<IAssetPluginPolishInput>,
    embryo: Readonly<IAssetPluginPolishOutput> | null,
    api_: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): Promise<IAssetPluginPolishOutput | null> {
    if (isImageAssetPolishInput(input)) {
      const result: IImageAssetPolishOutput = {
        datatype: AssetDataTypeEnum.BINARY,
        data: input.content,
      }
      return next(result)
    }
    return next(embryo)
  }
}
