import type {
  IAssetManager,
  IAssetResolverLocator,
  IResolvingAsset,
} from '@guanghechen/asset-types'

interface IAssetResolverLocatorProps {
  assetManager: IAssetManager
}

export class AssetResolverLocator implements IAssetResolverLocator {
  protected readonly _assetManager: IAssetManager
  protected readonly _locationMap: Map<string, IResolvingAsset | null> = new Map()

  constructor(props: IAssetResolverLocatorProps) {
    this._assetManager = props.assetManager
    this._locationMap = new Map()
  }

  public async locateAsset(locationId: string): Promise<IResolvingAsset | null | undefined> {
    return this._locationMap.get(locationId)
  }

  public async removeAsset(locationId: string): Promise<void> {
    const asset = this._locationMap.get(locationId)
    if (asset) {
      this._assetManager.remove(asset.guid)
      this._locationMap.delete(locationId)
    }
  }

  public async insertAsset(locationId: string, asset: IResolvingAsset | null): Promise<void> {
    if (asset) this._assetManager.insert(asset)
    this._locationMap.set(locationId, asset)
  }
}
