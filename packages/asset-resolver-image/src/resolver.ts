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

export class AssetResolverImage implements IAssetResolverPlugin {
  public readonly displayName: string
  protected readonly accepted: (src: string) => boolean
  protected readonly rejected: (src: string) => boolean

  constructor(props: IAssetResolverImageProps = {}) {
    this.displayName = props.displayName ?? '@guanghechen/asset-resolver-image'
    this.accepted = normalizePattern(props.accepted) ?? (() => true)
    this.rejected = normalizePattern(props.rejected) ?? (() => false)
  }

  public async locate(
    input: Readonly<IAssetPluginLocateInput>,
    embryo: Readonly<IAssetPluginLocateOutput> | null,
    api: Readonly<IAssetPluginLocateApi>,
    next: IAssetPluginLocateNext,
  ): Promise<IAssetPluginLocateOutput | null> {
    if (!embryo && this.accepted(input.src) && !this.rejected(input.src)) {
      const type: string = ImageAssetType
      const mimetype: string = mime.getType(input.filename) ?? 'unknown'
      let uri: string | null = await api.resolveUri(type, mimetype)

      if (uri?.startsWith('/')) {
        try {
          const prefix = 'https://localhost'
          const urlObj = new URL(`${prefix}${uri}`)
          if (!urlObj.searchParams.has('width') || !urlObj.searchParams.has('height')) {
            const rawContent: IBinaryFileData | null = await api.loadContent(input.filename)
            if (rawContent) {
              const result = sizeOf(rawContent)
              if (result.width && !urlObj.searchParams.has('width')) {
                urlObj.searchParams.set('width', String(result.width))
              }
              if (result.height && !urlObj.searchParams.has('height')) {
                urlObj.searchParams.set('height', String(result.height))
              }
              uri = urlObj.toString().slice(prefix.length)
            }
          }
        } catch (error) {
          console.error(error)
        }
      }

      const result: IAssetPluginLocateOutput = {
        type,
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
    if (isImageAssetPolishInput(input)) {
      const content: IBinaryFileData | null = await api.loadContent(input.filename)
      if (content !== null) {
        const result: IImageAssetPolishOutput = {
          sourcetype: ImageAssetType,
          datatype: AssetDataTypeEnum.BINARY,
          data: content,
        }
        return next(result)
      }
    }
    return next(embryo)
  }
}
