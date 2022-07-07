import type { IAssetCategoryId, IAssetId } from './_misc'

/**
 * Asset category.
 */
export interface IAssetCategory {
  /**
   * Unique identifier.
   */
  guid: IAssetCategoryId
  /**
   * Category identifier
   */
  identifier: string
  /**
   * Display name.
   */
  label: string
  /**
   * Unique identifier list of assets which are classified to this category.
   */
  assets: IAssetId[]
  /**
   * Parent node uuids, each category may belong to several different parent categories.
   *
   * ## Example
   *
   *    math --> number-theory --> prime
   *                 algorithm --> prime
   */
  parents: IAssetCategoryId[]
  /**
   * Child node uuids, each category may have multiple sub-categories.
   *
   * ## Example
   *
   *    math --> number-theory
   *    math --> linear-algebra
   */
  children: IAssetCategoryId[]
}

export interface IAssetCategoryMap {
  entities: IAssetCategory[]
}

export interface IAssetCategoryManager {
  dump(): IAssetCategoryMap
  findByGuid(guid: IAssetCategoryId): IAssetCategory | undefined
  findByIdentifier(identifier: string): IAssetCategory | undefined
  insert(categoryPath: ReadonlyArray<string>, assetId: IAssetId): IAssetCategory | undefined
  remove(guid: IAssetCategoryId, assetId: IAssetId): this
}
