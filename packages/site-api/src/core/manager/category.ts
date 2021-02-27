import type { AssetUUID, CategoryUUID } from '../entity/_types'
import type {
  CategoryDataItem,
  CategoryDataMap,
  RawCategoryDataItem,
} from '../entity/category'
import fs from 'fs-extra'
import invariant from 'tiny-invariant'
import { writeJSON } from '../../util/fs'
import { uniqueText } from '../../util/hash'
import { stringify } from '../../util/string'

/**
 * Only export no side-effect funcs from CategoryDataManager
 */
export type ImmutableCategoryDataManager = Pick<
  CategoryDataManager,
  'find' | 'normalize'
>

/**
 * CategoryDataManager constructor
 */
export interface CategoryDataManagerConstructor {
  /**
   * @param dataMapFilepath filepath of CategoryDataMap
   */
  new (dataMapFilepath: string): CategoryDataManager
}

export class CategoryDataManager {
  protected readonly dataMapFilepath: string
  protected readonly uuids: CategoryUUID[]
  protected readonly dataMap: Record<CategoryUUID, CategoryDataItem>

  public constructor(dataMapFilepath: string) {
    this.dataMapFilepath = dataMapFilepath
    this.uuids = []
    this.dataMap = {}
  }

  /**
   * Load category data map from categoryDataMap filepath
   */
  public async load(): Promise<void> {
    const data: CategoryDataMap = await fs.readJSON(this.dataMapFilepath)
    ;(this.uuids as CategoryUUID[]) = data.uuids
    ;(this.dataMap as Record<CategoryUUID, CategoryDataItem>) = data.entities
  }

  /**
   * Output category data map into tagDataMap file
   */
  public async dump(): Promise<void> {
    const data: CategoryDataMap = this.toDataMap()
    await writeJSON(this.dataMapFilepath, data)
  }

  /**
   * Return category data map
   */
  public toDataMap(): CategoryDataMap {
    const data: CategoryDataMap = {
      uuids: this.uuids,
      entities: this.dataMap,
    }
    return data
  }

  /**
   * Formatting CategoryDataItem
   *
   * @param category
   */
  public normalize(category: RawCategoryDataItem): CategoryDataItem {
    const title = typeof category === 'string' ? category : category.uuid
    const uuid: CategoryUUID = uniqueText(title)

    invariant(uuid != null, `Bad uuid. tag(${stringify(category)})`)

    let result: CategoryDataItem = this.dataMap[uuid]

    // Create a new one if it's not exist
    if (result == null) {
      result = {
        uuid,
        title,
        assets: [],
        parents: [],
        children: [],
        ...(typeof category !== 'string' ? category : undefined),
      }
    }

    return result
  }

  /**
   * Get CategoryEntity by tag uuid
   *
   * @param uuid
   */
  public find(uuid: CategoryUUID): CategoryDataItem | null {
    const result = this.dataMap[uuid]
    if (result == null) return null
    return result
  }

  /**
   * Create a category path if they are not exist, then append the assetId
   * to the asset list of the last node of the category path.
   *
   * @param categories  category path
   * @param assetUUID   uuid of asset
   */
  public insert(
    categories: Pick<CategoryDataItem, 'uuid' | 'title'>[],
    assetUUID: AssetUUID,
  ): void {
    let parent: CategoryDataItem | null = null
    for (const category of categories) {
      let current: CategoryDataItem = this.dataMap[category.uuid]

      // Create new category if it is not exists yet.
      if (current == null) {
        current = {
          uuid: category.uuid,
          title: category.title,
          assets: [],
          parents: [],
          children: [],
        }

        this.dataMap[current.uuid] = current
        this.uuids.push(current.uuid)
      }

      if (parent != null && !current.parents.includes(parent.uuid)) {
        current.parents.push(parent.uuid)
        parent.children.push(current.uuid)
      }

      parent = current
    }

    // append asset into the last category node
    if (parent != null) {
      if (!parent.assets.includes(assetUUID)) {
        parent.assets.push(assetUUID)
      }
    }
  }

  /**
   * Remove asset from the specified category
   *
   * @param uuid        uuid of category
   * @param assetUUID   uuid of asset
   */
  public remove(uuid: CategoryUUID, assetUUID: AssetUUID): void {
    const result = this.dataMap[uuid]
    if (result == null) return
    result.assets = result.assets.filter(asset => asset !== assetUUID)

    if (result.assets.length <= 0 && result.children.length <= 0) {
      this._drop(uuid, result.parents)
    }
  }

  /**
   * Drop category node if both the asset list and children are empty.
   * If dropped, then repeat this operation for its parent nodes.
   *
   * @param uuid
   */
  protected _drop(uuid: CategoryUUID, parents: CategoryUUID[]): void {
    ;(this.uuids as CategoryUUID[]) = this.uuids.filter(id => id !== uuid)
    this.dataMap[uuid] = undefined as any

    for (const parentUUID of parents) {
      const parent = this.dataMap[parentUUID]
      if (parent == null) continue
      parent.children = parent.children.filter(child => child !== uuid)
      if (parent.children.length <= 0 && parent.assets.length <= 0) {
        this._drop(parent.uuid, parent.parents)
      }
    }
  }
}
