import invariant from 'tiny-invariant'
import type { AssetType, AssetUUID } from '../entity/_types'
import type { AssetDataItem, AssetDataMap } from '../entity/asset'
import type { AssetDataManager } from '../manager/asset'


export class AssetService {
  protected readonly dataManager: AssetDataManager

  public constructor(dataManager: AssetDataManager) {
    this.dataManager = dataManager
  }

  /**
   * Get asset by uuid
   *
   * @param uuid
   */
  public fetchAsset(uuid: AssetUUID): AssetDataItem | null {
    return this.dataManager.find(uuid)
  }

  /**
   * Get all assets if size < 0, or get assets with pagination { page, size }
   *
   * @param type  asset type
   * @param page  page number
   * @param size  page size
   */
  public fetchAssets(type: AssetType, page = -1, size = -1): AssetDataItem[] {
    const dataMap: AssetDataMap = this.dataManager.toDataMap()
    const uuids = dataMap.uuids[type]

    invariant(uuids != null, `Unknown assetType (${ type })`)

    let result: AssetDataItem[]
    if (size < 0) {
      result = uuids.map(uuid => dataMap.entities[uuid])
    } else if (size === 0) {
      result = []
    } else {
      const offset = (page - 1) * size
      result = uuids
        .slice(offset, offset + size)
        .map(uuid => dataMap.entities[uuid])
    }

    return result
  }
}
