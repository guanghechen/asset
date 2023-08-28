import { AssetDataType } from '@guanghechen/asset-types'
import type {
  IAsset,
  IAssetDataMap,
  IAssetPluginLocateInput,
  IAssetResolverApi,
  IAssetSourceStorage,
  IAssetTargetStorage,
  IAssetUrlPrefixResolver,
  IBinaryLike,
} from '@guanghechen/asset-types'
import { calcFingerprint, mime, normalizeUrlPath } from '@guanghechen/asset-util'
import invariant from '@guanghechen/invariant'
import { v5 as uuid } from 'uuid'

export interface IAssetResolverApiProps {
  GUID_NAMESPACE: string // uuid
  sourceStorage: IAssetSourceStorage
  targetStorage: IAssetTargetStorage
  caseSensitive: boolean
  assetDataMapFilepath: string
  resolveUrlPathPrefix: IAssetUrlPrefixResolver
}

const extnameRegex = /\.([\w]+)$/

export class AssetResolverApi implements IAssetResolverApi {
  protected readonly GUID_NAMESPACE: string
  protected readonly sourceStorage: IAssetSourceStorage
  protected readonly targetStorage: IAssetTargetStorage
  protected readonly assetDataMapFilepath: string
  protected readonly caseSensitive: boolean
  protected readonly resolveUrlPathPrefix: IAssetUrlPrefixResolver

  constructor(props: IAssetResolverApiProps) {
    const { GUID_NAMESPACE, sourceStorage, targetStorage, assetDataMapFilepath } = props

    this.GUID_NAMESPACE = GUID_NAMESPACE
    this.sourceStorage = sourceStorage
    this.targetStorage = targetStorage
    this.assetDataMapFilepath = targetStorage.absolute(assetDataMapFilepath)

    this.caseSensitive = props.caseSensitive
    this.resolveUrlPathPrefix = props.resolveUrlPathPrefix
  }

  public async initAsset(srcLocation: string): Promise<IAssetPluginLocateInput | null> {
    const { sourceStorage } = this
    await sourceStorage.assertSafeLocation(srcLocation)
    await sourceStorage.assertExistedFile(srcLocation)

    const stat = await sourceStorage.statFile(srcLocation)
    const content = await sourceStorage.readBinaryFile(srcLocation)
    const hash = calcFingerprint(content)
    const filename = sourceStorage.basename(srcLocation)
    const locationId = this.normalizeLocation(srcLocation)
    const guid = this._genAssetGuid(locationId)
    const src = this._normalizeSrcLocation(srcLocation)
    const extname: string | undefined = srcLocation.match(extnameRegex)?.[1]

    return {
      guid,
      hash,
      src,
      extname,
      createdAt: new Date(stat.birthtime).toISOString(),
      updatedAt: new Date(stat.mtime).toISOString(),
      title: filename
        .trim()
        .replace(/\s+/, ' ')
        .replace(/\.[^.]+$/, ''),
      filename,
    }
  }

  public async saveAsset(params: {
    uri: string
    dataType: AssetDataType
    data: unknown
    encoding?: BufferEncoding
  }): Promise<void> {
    const { uri, dataType, data, encoding } = params
    if (data === null) return

    const { targetStorage } = this
    const dstLocation = targetStorage.absolute(
      uri.replace(/^[/\\]/, '').replace(/[?#][\s\S]+$/, ''),
    )
    await targetStorage.assertSafeLocation(dstLocation)
    await targetStorage.mkdirsIfNotExists(dstLocation, false)

    switch (dataType) {
      case AssetDataType.BINARY:
        await targetStorage.writeBinaryFile(dstLocation, data as IBinaryLike)
        break
      case AssetDataType.JSON: {
        await targetStorage.writeJsonFile(dstLocation, data)
        break
      }
      case AssetDataType.TEXT:
        invariant(
          encoding != null,
          `[${this.constructor.name}.saveAsset] encoding is required for text type file`,
        )
        await targetStorage.writeTextFile(dstLocation, data as string, encoding)
        break
      default:
        throw new Error(`[${this.constructor.name}.saveAsset] Unexpected dataType: ${dataType}`)
    }
  }

  public async saveAssetDataMap(data: IAssetDataMap): Promise<void> {
    const { targetStorage, assetDataMapFilepath } = this
    await targetStorage.mkdirsIfNotExists(assetDataMapFilepath, false)
    await targetStorage.writeJsonFile(assetDataMapFilepath, data)
  }

  public normalizeLocation(srcLocation: string): string {
    const relativeLocation: string = this._normalizeSrcLocation(srcLocation)
    const text: string = this.caseSensitive ? relativeLocation : relativeLocation.toLowerCase()
    const identifier = this._genLocationGuid(text)
    return identifier
  }

  public async loadSrcContent(srcLocation: string): Promise<Buffer> {
    const { sourceStorage } = this
    await sourceStorage.assertSafeLocation(srcLocation)
    await sourceStorage.assertExistedFile(srcLocation)
    const content = await sourceStorage.readBinaryFile(srcLocation)
    return content
  }

  public resolveSrcLocation(srcLocation: string): string {
    const { sourceStorage } = this
    return sourceStorage.absolute(srcLocation)
  }

  public resolveSlug(slug: string | null | undefined): string | null {
    return slug ?? null
  }

  public resolveUri(params: Pick<IAsset, 'guid' | 'type' | 'mimetype' | 'extname'>): string {
    const { guid, type, mimetype } = params
    const urlPathPrefix = this.resolveUrlPathPrefix({ assetType: type, mimetype })
    const extname: string | undefined = mime.getExtension(mimetype) ?? params.extname
    const url = `/${urlPathPrefix}/${guid}`
    return normalizeUrlPath(extname ? `${url}.${extname}` : url)
  }

  protected _normalizeSrcLocation(location: string): string {
    const { sourceStorage } = this
    const relativeLocation = sourceStorage.relative(location)
    return normalizeUrlPath(relativeLocation)
  }

  protected _genAssetGuid(identifier: string): string {
    return uuid(`#asset-${identifier}`, this.GUID_NAMESPACE)
  }

  protected _genLocationGuid(identifier: string): string {
    return uuid(`#location-${identifier}`, this.GUID_NAMESPACE)
  }
}
