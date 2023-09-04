import type {
  IAsset,
  IAssetDataMap,
  IAssetLocation,
  IAssetPluginLocateInput,
  IAssetResolverApi,
  IAssetResolverLocator,
  IAssetSourceStorage,
} from '@guanghechen/asset-types'
import { calcFingerprint, mime, normalizeUrlPath } from '@guanghechen/asset-util'
import path from 'node:path'
import { v5 as uuid } from 'uuid'

export interface IAssetResolverApiProps {
  GUID_NAMESPACE: string // uuid
  sourceStorage: IAssetSourceStorage
  locator: IAssetResolverLocator
}

const extnameRegex = /\.([\w]+)$/

export class AssetResolverApi implements IAssetResolverApi {
  protected readonly _GUID_NAMESPACE: string
  protected readonly _sourceStorage: IAssetSourceStorage
  protected readonly _locator: IAssetResolverLocator

  constructor(props: IAssetResolverApiProps) {
    const { GUID_NAMESPACE, sourceStorage } = props

    this._GUID_NAMESPACE = GUID_NAMESPACE
    this._sourceStorage = sourceStorage
    this._locator = props.locator
  }

  public dumpAssetDataMap(): Promise<IAssetDataMap> {
    return this._locator.dumpAssetDataMap()
  }

  public insertAsset(location: string, asset: IAsset | null): Promise<void> {
    const locationId: string = this._identifyLocation(location)
    return this._locator.insertAsset(locationId, asset)
  }

  public locateAsset(location: string): Promise<IAsset | null | undefined> {
    const locationId: string = this._identifyLocation(location)
    return this._locator.locateAsset(locationId)
  }

  public removeAsset(location: string): Promise<void> {
    const locationId: string = this._identifyLocation(location)
    return this._locator.removeAsset(locationId)
  }

  public async initAsset(location: string): Promise<IAssetPluginLocateInput | null> {
    const { _sourceStorage } = this
    _sourceStorage.assertSafeLocation(location)
    await _sourceStorage.assertExistedFile(location)

    const stat = await _sourceStorage.statFile(location)
    const content: Buffer | null = await _sourceStorage.readBinaryFile(location)
    const hash: string = calcFingerprint(content)
    const filename: string = path.basename(location)
    const locationId: string = this._identifyLocation(location)
    const guid: string = this._genAssetGuid(locationId)
    const src: string = this._normalizeSrcLocation(location)
    const createdAt: string = new Date(stat.birthtime).toISOString()
    const updatedAt: string = new Date(stat.mtime).toISOString()
    const extname: string | undefined = location.match(extnameRegex)?.[1]
    const title: string = filename
      .trim()
      .replace(/\s+/, ' ')
      .replace(/\.[^.]+$/, '')
    return { guid, hash, src, extname, createdAt, updatedAt, title, filename }
  }

  public isRelativeLocation(location: string): boolean {
    return this._sourceStorage.isSafeLocation(location)
  }

  public async loadContent(location_: string): Promise<Buffer> {
    const location: string = this._sourceStorage.absolute(location_)
    this._sourceStorage.assertSafeLocation(location)
    await this._sourceStorage.assertExistedFile(location)
    const content: Buffer = await this._sourceStorage.readBinaryFile(location)
    return content
  }

  public async resolveSlug(slug: string | null | undefined): Promise<string | null> {
    return slug ?? null
  }

  public async resolveUri(asset: Readonly<IAssetLocation>): Promise<string> {
    const { guid, type, mimetype } = asset
    const uriPrefix: string = await this._locator.resolveUriPrefix(type, mimetype)
    const extname: string | undefined = mime.getExtension(mimetype) ?? asset.extname
    const uri: string = `/${uriPrefix}/${guid}`
    return normalizeUrlPath(extname ? `${uri}.${extname}` : uri)
  }

  protected _identifyLocation(location: string): string {
    const relativeLocation: string = this._normalizeSrcLocation(location)
    const normalized: string = this._sourceStorage.caseSensitive
      ? relativeLocation
      : relativeLocation.toLowerCase()
    return uuid(`#location-${normalized}`, this._GUID_NAMESPACE)
  }

  protected _normalizeSrcLocation(location: string): string {
    const { _sourceStorage } = this
    const relativeLocation = _sourceStorage.relative(location)
    return normalizeUrlPath(relativeLocation)
  }

  protected _genAssetGuid(identifier: string): string {
    return uuid(`#asset-${identifier}`, this._GUID_NAMESPACE)
  }
}
