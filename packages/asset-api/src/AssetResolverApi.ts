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
  protected readonly _GUID_NAMESPACE: string
  protected readonly _sourceStorage: IAssetSourceStorage
  protected readonly _targetStorage: IAssetTargetStorage
  protected readonly _assetDataMapFilepath: string
  protected readonly _caseSensitive: boolean
  protected readonly _resolveUrlPathPrefix: IAssetUrlPrefixResolver

  constructor(props: IAssetResolverApiProps) {
    const { GUID_NAMESPACE, sourceStorage, targetStorage, assetDataMapFilepath } = props
    this._GUID_NAMESPACE = GUID_NAMESPACE
    this._sourceStorage = sourceStorage
    this._targetStorage = targetStorage
    this._assetDataMapFilepath = targetStorage.absolute(assetDataMapFilepath)
    this._caseSensitive = props.caseSensitive
    this._resolveUrlPathPrefix = props.resolveUrlPathPrefix
  }

  public async initAsset(srcLocation: string): Promise<IAssetPluginLocateInput | null> {
    const { _sourceStorage } = this
    await _sourceStorage.assertSafeLocation(srcLocation)
    await _sourceStorage.assertExistedFile(srcLocation)

    const stat = await _sourceStorage.statFile(srcLocation)
    const content = await _sourceStorage.readBinaryFile(srcLocation)
    const hash = calcFingerprint(content)
    const filename = _sourceStorage.basename(srcLocation)
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

    const { _targetStorage } = this
    const dstLocation = _targetStorage.absolute(
      uri.replace(/^[/\\]/, '').replace(/[?#][\s\S]+$/, ''),
    )
    await _targetStorage.assertSafeLocation(dstLocation)
    await _targetStorage.mkdirsIfNotExists(dstLocation, false)

    switch (dataType) {
      case AssetDataType.BINARY:
        await _targetStorage.writeBinaryFile(dstLocation, data as IBinaryLike)
        break
      case AssetDataType.JSON: {
        await _targetStorage.writeJsonFile(dstLocation, data)
        break
      }
      case AssetDataType.TEXT:
        invariant(
          !!encoding,
          `[${this.constructor.name}.saveAsset] encoding is required for text type file`,
        )
        await _targetStorage.writeTextFile(dstLocation, data as string, encoding)
        break
      default:
        throw new Error(`[${this.constructor.name}.saveAsset] Unexpected dataType: ${dataType}`)
    }
  }

  public async saveAssetDataMap(data: IAssetDataMap): Promise<void> {
    const { _targetStorage, _assetDataMapFilepath } = this
    await _targetStorage.mkdirsIfNotExists(_assetDataMapFilepath, false)
    await _targetStorage.writeJsonFile(_assetDataMapFilepath, data)
  }

  public normalizeLocation(srcLocation: string): string {
    const relativeLocation: string = this._normalizeSrcLocation(srcLocation)
    const text: string = this._caseSensitive ? relativeLocation : relativeLocation.toLowerCase()
    const identifier = this._genLocationGuid(text)
    return identifier
  }

  public async loadSrcContent(srcLocation: string): Promise<Buffer> {
    const { _sourceStorage } = this
    await _sourceStorage.assertSafeLocation(srcLocation)
    await _sourceStorage.assertExistedFile(srcLocation)
    const content = await _sourceStorage.readBinaryFile(srcLocation)
    return content
  }

  public resolveSrcLocation(srcLocation: string): string {
    const { _sourceStorage } = this
    return _sourceStorage.absolute(srcLocation)
  }

  public resolveSlug(slug: string | null | undefined): string | null {
    return slug ?? null
  }

  public resolveUri(params: Pick<IAsset, 'guid' | 'type' | 'mimetype' | 'extname'>): string {
    const { guid, type, mimetype } = params
    const urlPathPrefix = this._resolveUrlPathPrefix({ assetType: type, mimetype })
    const extname: string | undefined = mime.getExtension(mimetype) ?? params.extname
    const url = `/${urlPathPrefix}/${guid}`
    return normalizeUrlPath(extname ? `${url}.${extname}` : url)
  }

  protected _normalizeSrcLocation(location: string): string {
    const { _sourceStorage } = this
    const relativeLocation = _sourceStorage.relative(location)
    return normalizeUrlPath(relativeLocation)
  }

  protected _genAssetGuid(identifier: string): string {
    return uuid(`#asset-${identifier}`, this._GUID_NAMESPACE)
  }

  protected _genLocationGuid(identifier: string): string {
    return uuid(`#location-${identifier}`, this._GUID_NAMESPACE)
  }
}
