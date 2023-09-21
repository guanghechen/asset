import type {
  IAsset,
  IAssetDataMap,
  IAssetLocation,
  IAssetManager,
  IAssetMeta,
  IAssetPathResolver,
  IAssetPluginLocateInput,
  IAssetResolverApi,
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
  assetManager: IAssetManager
  uriResolver: IAssetUriResolver
}

const extnameRegex = /\.([\w]+)$/

export class AssetResolverApi implements IAssetResolverApi {
  public readonly GUID_NAMESPACE: string
  protected readonly _manager: IAssetManager
  protected readonly _sourceStorage: IAssetSourceStorage
  protected readonly _uriResolver: IAssetUriResolver

  constructor(props: IAssetResolverApiProps) {
    const { GUID_NAMESPACE, assetManager, sourceStorage } = props

    this.GUID_NAMESPACE = GUID_NAMESPACE
    this._manager = assetManager
    this._sourceStorage = sourceStorage
    this._uriResolver = props.uriResolver
  }

  public async dumpAssetDataMap(): Promise<IAssetDataMap> {
    return this._manager.dump()
  }

  public async insertAsset(asset: IAsset): Promise<void> {
    this._manager.insert(asset)
  }

  public async locateAsset(srcPath: string): Promise<IAsset | undefined> {
    const guid: string = await this.resolveGUID(srcPath)
    return this._manager.get(guid)
  }

  public async removeAsset(srcPath: string): Promise<void> {
    const guid: string = await this.resolveGUID(srcPath)
    this._manager.remove(guid)
  }

  public async resolveSlug(asset: Readonly<IAssetMeta>): Promise<string | null> {
    return this._uriResolver.resolveSlug(asset)
  }

  public async resolveUri(asset: Readonly<IAssetLocation>): Promise<string> {
    return this._uriResolver.resolveUri(asset)
  }

  public async initAsset(srcPath: string): Promise<IAssetPluginLocateInput | null> {
    const { _sourceStorage } = this
    const filepath: string = _sourceStorage.pathResolver.absolute(srcPath)

    _sourceStorage.pathResolver.assertSafePath(filepath)
    await _sourceStorage.assertExistedFile(filepath)

    const guid: string = await this.resolveGUID(filepath)
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

  public resolveRefPath(curDir: string, refPath: string): string | null {
    const pathResolver: IAssetPathResolver = this._sourceStorage.pathResolver
    const filepath: string = pathResolver.isAbsolute(refPath)
      ? refPath
      : pathResolver.absolute(refPath, curDir)
    return pathResolver.isSafePath(filepath) ? filepath : null
  }

  public async loadContent(srcPath: string): Promise<IBinaryFileData | null> {
    const filepath: string = this._sourceStorage.pathResolver.absolute(srcPath)
    this._sourceStorage.pathResolver.assertSafePath(filepath)
    await this._sourceStorage.assertExistedFile(filepath)
    const sourceItem: ISourceItem | undefined = await this._sourceStorage.readFile(filepath)
    const content: IBinaryFileData | undefined = sourceItem?.data as IBinaryFileData | undefined
    return content ?? null
  }

  public async resolveGUID(srcPath: string): Promise<string> {
    const id: string = this._sourceStorage.pathResolver.identify(srcPath)
    const guid: string = uuid(`#path-${id}`, this.GUID_NAMESPACE)
    return guid
  }
}
