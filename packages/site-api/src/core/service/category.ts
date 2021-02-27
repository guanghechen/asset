import type { CategoryUUID } from '../entity/_types'
import type { CategoryDataItem, CategoryDataMap } from '../entity/category'
import type { CategoryDataManager } from '../manager/category'

/**
 * CategoryService constructor
 */
export interface CategoryServiceConstructor {
  /**
   * @param dataManager
   */
  new (dataManager: CategoryDataManager): CategoryService
}


export class CategoryService {
  protected readonly dataManager: CategoryDataManager

  public constructor(dataManager: CategoryDataManager) {
    this.dataManager = dataManager
  }

  /**
   * Get category by uuid
   *
   * @param uuid
   */
  public fetchCategory(uuid: CategoryUUID): CategoryDataItem | null {
    return this.dataManager.find(uuid)
  }

  /**
   * Get all tag Categories
   */
  public fetchCategories(): CategoryDataItem[] {
    const dataMap: CategoryDataMap = this.dataManager.toDataMap()
    const result: CategoryDataItem[] = dataMap.uuids
      .map(uuid => dataMap.entities[uuid])
    return result
  }
}
