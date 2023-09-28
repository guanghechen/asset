import type { IAsset } from './asset'
import type { IAssetDataMap } from './asset-manager'

export interface IAssetLocator {
  /**
   * Dump asset data map.
   */
  dumpAssetDataMap(): Promise<IAssetDataMap>

  /**
   * Find asset by predicate function.
   * @param predicate
   */
  findAsset(predicate: (asset: Readonly<IAsset>) => boolean): Promise<IAsset | null>

  /**
   * Find the absolute source path by the given uri.
   * @param uri
   */
  findSrcPathByUri(uri: string): Promise<string | null>

  /**
   * Set asset to locator.
   * @param absoluteSrcPath
   * @param asset
   */
  insertAsset(absoluteSrcPath: string, asset: IAsset): Promise<void>

  /**
   * Try to locate an resolving asset.
   * @param absoluteSrcPath
   */
  locateAsset(absoluteSrcPath: string): Promise<IAsset | null>

  /**
   * Remove asset from locator.
   * @param absoluteSrcPath
   */
  removeAsset(absoluteSrcPath: string): Promise<void>

  /**
   * Resolve the guid by the given absolute source path.
   * @param absoluteSrcPath
   */
  resolveGUID(absoluteSrcPath: string): Promise<string>
}
