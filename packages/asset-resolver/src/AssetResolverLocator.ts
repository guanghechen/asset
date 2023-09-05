import { AssetManager } from '@guanghechen/asset-manager'
import type {
  IAsset,
  IAssetDataMap,
  IAssetManager,
  IAssetResolverLocator,
} from '@guanghechen/asset-types'

interface IAssetResolverLocatorProps {
  /**
   * Resolve asset uri prefix.
   * @param assetType
   * @param mimeType
   */
  resolveUriPrefix(assetType: string, mimeType: string): Promise<string>
}

export class AssetResolverLocator implements IAssetResolverLocator {
  protected readonly _assetManager: IAssetManager
  protected readonly _srcPathMap: Map<string, IAsset | null> = new Map()
  protected readonly _resolveUriPrefix: (assetType: string, mimeType: string) => Promise<string>

  constructor(props: IAssetResolverLocatorProps) {
    this._assetManager = new AssetManager()
    this._srcPathMap = new Map()
    this._resolveUriPrefix = props.resolveUriPrefix
  }

  public async dumpAssetDataMap(): Promise<IAssetDataMap> {
    return this._assetManager.dump()
  }

  public async insertAsset(srcPathId: string, asset: IAsset | null): Promise<void> {
    if (asset) this._assetManager.insert(asset)
    this._srcPathMap.set(srcPathId, asset)
  }

  public async locateAsset(srcPathId: string): Promise<IAsset | null | undefined> {
    return this._srcPathMap.get(srcPathId)
  }

  public async removeAsset(srcPathId: string): Promise<void> {
    const asset = this._srcPathMap.get(srcPathId)
    if (asset) {
      this._assetManager.remove(asset.guid)
      this._srcPathMap.delete(srcPathId)
    }
  }

  public async resolveUriPrefix(assetType: string, mimeType: string): Promise<string> {
    return this._resolveUriPrefix(assetType, mimeType)
  }
}
