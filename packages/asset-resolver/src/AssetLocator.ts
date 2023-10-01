import type {
  IAsset,
  IAssetDataMap,
  IAssetLocator,
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
  protected readonly _assetMap: Map<string, IAsset> // map asset.guid to asset
  protected readonly _uri2src: Map<string, string> // map asset.uri to src

  constructor(props: IAssetLocatorProps) {
    const { GUID_NAMESPACE, pathResolver } = props
    const assetMap: Map<string, IAsset> = new Map<string, IAsset>()
    const uri2src: Map<string, string> = new Map<string, string>()

    this._GUID_NAMESPACE = GUID_NAMESPACE
    this._pathResolver = pathResolver
    this._assetMap = assetMap
    this._uri2src = uri2src
  }

  public async dumpAssetDataMap(): Promise<IAssetDataMap> {
    return {
      assets: Array.from(this._assetMap.values()).sort((x, y) => x.uri.localeCompare(y.uri)),
    }
  }

  public async findAsset(predicate: (asset: Readonly<IAsset>) => boolean): Promise<IAsset | null> {
    for (const asset of this._assetMap.values()) {
      if (predicate(asset)) return asset
    }
    return null
  }

  public async findAssetBySrcPath(absoluteSrcPath: string): Promise<IAsset | null> {
    const pathResolver: IAssetPathResolver = this._pathResolver
    const srcRoot: string | null = pathResolver.findSrcRoot(absoluteSrcPath)
    if (srcRoot === null) return null

    const guid: string = await this.resolveGUID(absoluteSrcPath)
    return this._assetMap.get(guid) ?? null
  }

  public async findSrcPathByUri(uri: string): Promise<string | null> {
    return this._uri2src.get(uri) ?? null
  }

  public async insertAsset(absoluteSrcPath: string, asset: IAsset): Promise<void> {
    this._pathResolver.assertSafeAbsolutePath(absoluteSrcPath)
    this._assetMap.set(asset.guid, asset)
    this._uri2src.set(asset.uri, absoluteSrcPath)
  }

  public async removeAsset(absoluteSrcPath: string): Promise<void> {
    this._pathResolver.assertSafeAbsolutePath(absoluteSrcPath)
    const guid: string = await this.resolveGUID(absoluteSrcPath)
    const asset: IAsset | undefined = this._assetMap.get(guid)
    if (asset === undefined) return

    this._assetMap.delete(asset.guid)
    this._uri2src.delete(asset.uri)
  }

  public async resolveGUID(absoluteSrcPath: string): Promise<string> {
    const pathResolver: IAssetPathResolver = this._pathResolver
    const id: string = pathResolver.identify(absoluteSrcPath)
    const guid: string = uuid(`#path-${id}`, this._GUID_NAMESPACE)
    return guid
  }
}
