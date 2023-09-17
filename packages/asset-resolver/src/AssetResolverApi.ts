import type {
  IAsset,
  IAssetDataMap,
  IAssetLocation,
  IAssetPluginLocateInput,
  IAssetResolverApi,
  IAssetResolverLocator,
  IAssetSourceStorage,
  IAssetUriResolver,
  IBinaryFileData,
  ISourceItem,
} from '@guanghechen/asset-types'
import { calcFingerprint, normalizeUrlPath } from '@guanghechen/asset-util'
import path from 'node:path'
import { v5 as uuid } from 'uuid'

export interface IAssetResolverApiProps {
  GUID_NAMESPACE: string
  sourceStorage: IAssetSourceStorage
  locator: IAssetResolverLocator
  uriResolver: IAssetUriResolver
}

const extnameRegex = /\.([\w]+)$/

export class AssetResolverApi implements IAssetResolverApi {
  public readonly GUID_NAMESPACE: string
  protected readonly _sourceStorage: IAssetSourceStorage
  protected readonly _locator: IAssetResolverLocator
  protected readonly _uriResolver: IAssetUriResolver

  constructor(props: IAssetResolverApiProps) {
    const { GUID_NAMESPACE, sourceStorage } = props

    this.GUID_NAMESPACE = GUID_NAMESPACE
    this._sourceStorage = sourceStorage
    this._locator = props.locator
    this._uriResolver = props.uriResolver
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

  public async resolveSlug(slug: string | null | undefined): Promise<string | null> {
    return this._uriResolver.resolveSlug(slug)
  }

  public async resolveUri(asset: Readonly<IAssetLocation>): Promise<string> {
    return this._uriResolver.resolveUri(asset)
  }

  public async initAsset(srcPath: string): Promise<IAssetPluginLocateInput | null> {
    const { _sourceStorage } = this
    const filepath: string = _sourceStorage.pathResolver.absolute(srcPath)

    _sourceStorage.pathResolver.assertSafePath(filepath)
    await _sourceStorage.assertExistedFile(filepath)

    const id: string = _sourceStorage.pathResolver.identify(filepath)
    const guid: string = uuid(`#path-${id}`, this.GUID_NAMESPACE)

    const stat = await _sourceStorage.statFile(filepath)
    const sourceItem: ISourceItem | undefined = await _sourceStorage.readFile(filepath)
    const content: IBinaryFileData | undefined = sourceItem?.data as IBinaryFileData | undefined
    const hash: string = calcFingerprint(content)
    const filename: string = path.basename(filepath)
    const src: string = normalizeUrlPath(_sourceStorage.pathResolver.relative(filepath))
    const createdAt: string = new Date(stat.birthtime).toISOString()
    const updatedAt: string = new Date(stat.mtime).toISOString()
    const extname: string | undefined = filepath.match(extnameRegex)?.[1]
    const title: string = filename
      .trim()
      .replace(/\s+/, ' ')
      .replace(/\.[^.]+$/, '')
    return { guid, hash, src, extname, createdAt, updatedAt, title, filename }
  }

  public isRelativePath(srcPath: string): boolean {
    return this._sourceStorage.pathResolver.isSafePath(srcPath)
  }

  public async loadContent(srcPath: string): Promise<IBinaryFileData | null> {
    const filepath: string = this._sourceStorage.pathResolver.absolute(srcPath)
    this._sourceStorage.pathResolver.assertSafePath(filepath)
    await this._sourceStorage.assertExistedFile(filepath)
    const sourceItem: ISourceItem | undefined = await this._sourceStorage.readFile(filepath)
    const content: IBinaryFileData | undefined = sourceItem?.data as IBinaryFileData | undefined
    return content ?? null
  }
}
