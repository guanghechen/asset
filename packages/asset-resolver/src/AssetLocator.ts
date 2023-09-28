import { AssetManager } from '@guanghechen/asset-manager'
import type {
  IAsset,
  IAssetDataMap,
  IAssetLocator,
  IAssetManager,
  IAssetPathResolver,
} from '@guanghechen/asset-types'
import { v5 as uuid } from 'uuid'

export interface IAssetLocatorProps {
  GUID_NAMESPACE: string
  pathResolver: IAssetPathResolver
}

export class AssetLocator implements IAssetLocator {
  protected readonly _GUID_NAMESPACE: string
  protected readonly _pathResolver: IAssetPathResolver
  protected readonly _assetManager: IAssetManager
  protected readonly _uri2src: Map<string, string> // map asset.uri to src

  constructor(props: IAssetLocatorProps) {
    const { GUID_NAMESPACE, pathResolver } = props
    const assetManager: IAssetManager = new AssetManager()
    const uri2src: Map<string, string> = new Map<string, string>()

    this._GUID_NAMESPACE = GUID_NAMESPACE
    this._pathResolver = pathResolver
    this._assetManager = assetManager
    this._uri2src = uri2src
  }

  public async dumpAssetDataMap(): Promise<IAssetDataMap> {
    return this._assetManager.dump()
  }

  public async findAsset(predicate: (asset: Readonly<IAsset>) => boolean): Promise<IAsset | null> {
    return this._assetManager.find(predicate)
  }

  public async findSrcPathByUri(uri: string): Promise<string | null> {
    return this._uri2src.get(uri) ?? null
  }

  public async insertAsset(absoluteSrcPath: string, asset: IAsset): Promise<void> {
    this._pathResolver.assertSafeAbsolutePath(absoluteSrcPath)
    this._assetManager.insert(asset)
    this._uri2src.set(asset.uri, absoluteSrcPath)
  }

  public async locateAsset(absoluteSrcPath: string): Promise<IAsset | null> {
    const pathResolver: IAssetPathResolver = this._pathResolver
    const srcRoot: string | null = pathResolver.findSrcRoot(absoluteSrcPath)
    if (srcRoot === null) return null

    const guid: string = await this.resolveGUID(absoluteSrcPath)
    return this._assetManager.get(guid) ?? null
  }

  public async removeAsset(absoluteSrcPath: string): Promise<void> {
    const pathResolver: IAssetPathResolver = this._pathResolver
    pathResolver.assertSafeAbsolutePath(absoluteSrcPath)

    const guid: string = await this.resolveGUID(absoluteSrcPath)
    const asset: IAsset | undefined = this._assetManager.get(guid)
    if (asset === undefined) return
    this._assetManager.remove(guid)
    this._uri2src.delete(asset.uri)
  }

  public async resolveGUID(absoluteSrcPath: string): Promise<string> {
    const pathResolver: IAssetPathResolver = this._pathResolver
    const id: string = pathResolver.identify(absoluteSrcPath)
    const guid: string = uuid(`#path-${id}`, this._GUID_NAMESPACE)
    return guid
  }
}
