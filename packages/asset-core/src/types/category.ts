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
   * Category path fingerprint.
   */
  fingerprint: string
  /**
   * Category path labels, such as ['math', 'number-theory'].
   */
  path: string[]
  /**
   * Unique identifier list of assets which are classified to this category.
   */
  assets: IAssetId[]
  /**
   * Parent node's guid, each category node must have at most one parent as the category should
   * consisted as a tree instead of DAG.
   */
  parent: IAssetCategoryId | null
  /**
   * Child nodes' guid, each category may have multiple sub-categories.
   *
   * ## Example
   *
   *    math --> number-theory
   *    math --> linear-algebra
   *
   * Both `number-theory` and `linear-algebra` are `math`'s child in the above case.
   */
  children: IAssetCategoryId[]
}

export interface IAssetCategoryDataMap {
  entities: IAssetCategory[]
}

export interface IAssetCategoryManager {
  fromJSON(json: Readonly<IAssetCategoryDataMap>): void
  toJSON(): IAssetCategoryDataMap
  findByGuid(guid: IAssetCategoryId): IAssetCategory | undefined
  findByFingerprint(fingerprint: string): IAssetCategory | undefined
  insert(categoryPath: string, assetId: IAssetId): IAssetCategory | undefined
  remove(guid: IAssetCategoryId, assetId: IAssetId): void
}
