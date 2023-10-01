import type { IAsset } from './asset'

export interface IAssetDataMap {
  assets: IAsset[]
}

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
   * Find asset by guid
   * @param guid
   */
  findAssetByGuid(guid: string): Promise<IAsset | null>

  /**
   * Find the asset by source path.
   * @param absoluteSrcPath
   */
  findAssetBySrcPath(absoluteSrcPath: string): Promise<IAsset | null>

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
