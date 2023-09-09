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
  GUID_NAMESPACE: string
  sourceStorage: IAssetSourceStorage
  locator: IAssetResolverLocator
}

const extnameRegex = /\.([\w]+)$/

export class AssetResolverApi implements IAssetResolverApi {
  public readonly GUID_NAMESPACE: string
  protected readonly _sourceStorage: IAssetSourceStorage
  protected readonly _locator: IAssetResolverLocator

  constructor(props: IAssetResolverApiProps) {
    const { GUID_NAMESPACE, sourceStorage } = props

    this.GUID_NAMESPACE = GUID_NAMESPACE
    this._sourceStorage = sourceStorage
    this._locator = props.locator
  }

  public dumpAssetDataMap(): Promise<IAssetDataMap> {
    return this._locator.dumpAssetDataMap()
  }

  public insertAsset(srcPath: string, asset: IAsset | null): Promise<void> {
    const id: string = this._sourceStorage.pathResolver.identify(srcPath)
    return this._locator.insertAsset(id, asset)
  }

  public locateAsset(srcPath: string): Promise<IAsset | null | undefined> {
    const id: string = this._sourceStorage.pathResolver.identify(srcPath)
    return this._locator.locateAsset(id)
  }

  public removeAsset(srcPath: string): Promise<void> {
    const id: string = this._sourceStorage.pathResolver.identify(srcPath)
    return this._locator.removeAsset(id)
  }

  public async initAsset(srcPath: string): Promise<IAssetPluginLocateInput | null> {
    const { _sourceStorage } = this
    _sourceStorage.pathResolver.assertSafePath(srcPath)
    await _sourceStorage.assertExistedFile(srcPath)

    const id: string = _sourceStorage.pathResolver.identify(srcPath)
    const guid: string = uuid(`#path-${id}`, this.GUID_NAMESPACE)

    const stat = await _sourceStorage.statFile(srcPath)
    const content: Buffer | null = await _sourceStorage.readBinaryFile(srcPath)
    const hash: string = calcFingerprint(content)
    const filename: string = path.basename(srcPath)
    const src: string = normalizeUrlPath(_sourceStorage.pathResolver.relative(srcPath))
    const createdAt: string = new Date(stat.birthtime).toISOString()
    const updatedAt: string = new Date(stat.mtime).toISOString()
    const extname: string | undefined = srcPath.match(extnameRegex)?.[1]
    const title: string = filename
      .trim()
      .replace(/\s+/, ' ')
      .replace(/\.[^.]+$/, '')
    return { guid, hash, src, extname, createdAt, updatedAt, title, filename }
  }

  public isRelativePath(srcPath: string): boolean {
    return this._sourceStorage.pathResolver.isSafePath(srcPath)
  }

  public async loadContent(srcPath_: string): Promise<Buffer> {
    const srcPath: string = this._sourceStorage.pathResolver.absolute(srcPath_)
    this._sourceStorage.pathResolver.assertSafePath(srcPath)
    await this._sourceStorage.assertExistedFile(srcPath)
    const content: Buffer = await this._sourceStorage.readBinaryFile(srcPath)
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
}
