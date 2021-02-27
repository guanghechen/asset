import type { AssetUUID, CategoryUUID } from './_types'

/**
 *
 */
export type RawCategoryDataItem = CategoryUUID | Pick<CategoryDataItem, 'uuid'>


/**
 * Category item
 */
export interface CategoryDataItem {
  /**
   * Unique identification of category
   */
  uuid: CategoryUUID
  /**
   * Displayed name of category
   */
  title: string
  /**
   * Universally Unique Identifier list of assets which belongs this category
   */
  assets: AssetUUID[]
  /**
   * Parent node uuids
   * Each category may belong to several different parent categories
   *
   * Example:
   *
   *                 algorithm --> prime
   *    math --> number-theory --> prime
   */
  parents: CategoryUUID[]
  /**
   * Child node uuids
   * Each category may have multiple subcategories
   *
   * Example:
   *
   *    math --> number-theory
   *    math --> linear-algebra
   */
  children: CategoryUUID[]
}


/**
 * Category data map
 */
export interface CategoryDataMap {
  /**
   * Category uuid list
   */
  uuids: CategoryUUID[]
  /**
   * Category entities
   */
  entities: Record<CategoryUUID, CategoryDataItem>
}
