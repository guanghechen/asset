import { AssetDataType } from '@guanghechen/asset-types'
import type {
  IAssetDataMap,
  IAssetLocation,
  IAssetPluginLocateInput,
  IAssetResolverApi,
  IAssetSourceStorage,
  IAssetTargetStorage,
  IAssetUrlPrefixResolver,
  IBinaryLike,
} from '@guanghechen/asset-types'
import { calcFingerprint, mime, normalizeUrlPath } from '@guanghechen/asset-util'
import invariant from '@guanghechen/invariant'
import type { IReporter } from '@guanghechen/types'
import { v5 as uuid } from 'uuid'

export interface IAssetResolverApiProps {
  GUID_NAMESPACE: string // uuid
  sourceStorage: IAssetSourceStorage
  targetStorage: IAssetTargetStorage
  dataMapUri: string
  reporter: IReporter
  resolveUrlPathPrefix: IAssetUrlPrefixResolver
}

const extnameRegex = /\.([\w]+)$/

export class AssetResolverApi implements IAssetResolverApi {
  protected readonly _GUID_NAMESPACE: string
  protected readonly _sourceStorage: IAssetSourceStorage
  protected readonly _targetStorage: IAssetTargetStorage
  protected readonly _dataMapUri: string
  protected readonly _reporter: IReporter
  protected readonly _resolveUrlPathPrefix: IAssetUrlPrefixResolver

  constructor(props: IAssetResolverApiProps) {
    const {
      GUID_NAMESPACE,
      sourceStorage,
      targetStorage,
      dataMapUri,
      reporter,
      resolveUrlPathPrefix,
    } = props

    this._GUID_NAMESPACE = GUID_NAMESPACE
    this._sourceStorage = sourceStorage
    this._targetStorage = targetStorage
    this._dataMapUri = dataMapUri
    this._reporter = reporter
    this._resolveUrlPathPrefix = resolveUrlPathPrefix
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

    const dstLocation = this.resolveDstLocationFromUri(uri)
    this._reporter.verbose('[saveAsset] uri: {}', uri)

    const { _targetStorage } = this
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
    await this.saveAsset({
      uri: this._dataMapUri,
      dataType: AssetDataType.JSON,
      data,
    })
  }

  public async removeAsset(uri: string): Promise<void> {
    const dstLocation = this.resolveDstLocationFromUri(uri)
    this._reporter.verbose('[removeAsset] uri({}), dstLocation({})', uri, dstLocation)
    await this._targetStorage.removeFile(dstLocation)
  }

  public normalizeLocation(srcLocation: string): string {
    const relativeLocation: string = this._normalizeSrcLocation(srcLocation)
    const text: string = this._sourceStorage.caseSensitive
      ? relativeLocation
      : relativeLocation.toLowerCase()
    const identifier: string = this._genLocationGuid(text)
    return identifier
  }

  public async loadSrcContent(srcLocation: string): Promise<Buffer> {
    const { _sourceStorage } = this
    await _sourceStorage.assertSafeLocation(srcLocation)
    await _sourceStorage.assertExistedFile(srcLocation)
    const content: Buffer = await _sourceStorage.readBinaryFile(srcLocation)
    return content
  }

  public resolveSrcLocation(srcLocation: string): string {
    return this._sourceStorage.absolute(srcLocation)
  }

  public resolveDstLocationFromUri(uri: string): string {
    return this._targetStorage.absolute(uri.replace(/^[/\\]/, '').replace(/[?#][\s\S]+$/, ''))
  }

  public async resolveSlug(slug: string | null | undefined): Promise<string | null> {
    return slug ?? null
  }

  public async resolveUri(asset: Readonly<IAssetLocation>): Promise<string> {
    const { guid, type, mimetype } = asset
    const urlPathPrefix = this._resolveUrlPathPrefix({ assetType: type, mimetype })
    const extname: string | undefined = mime.getExtension(mimetype) ?? asset.extname
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
