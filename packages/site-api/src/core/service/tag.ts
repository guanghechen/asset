import type { TagUUID } from '../entity/_types'
import type { TagDataItem, TagDataMap } from '../entity/tag'
import type { TagDataManager } from '../manager/tag'


export class TagService {
  protected readonly dataManager: TagDataManager

  public constructor(dataManager: TagDataManager) {
    this.dataManager = dataManager
  }

  /**
   * Get tag by uuid
   *
   * @param uuid
   */
  public fetchTag(uuid: TagUUID): TagDataItem | null {
    return this.dataManager.find(uuid)
  }

  /**
   * Get all tag entities
   */
  public fetchTags(): TagDataItem[] {
    const dataMap: TagDataMap = this.dataManager.toDataMap()
    const result: TagDataItem[] = dataMap.uuids
      .map(uuid => dataMap.entities[uuid])
    return result
  }
}