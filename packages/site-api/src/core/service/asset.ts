import invariant from 'tiny-invariant'
import type { AssetLocation, AssetType, AssetUUID } from '../entity/_types'
import type { AssetDataItem, AssetDataMap } from '../entity/asset'
import type { AssetDataManager } from '../manager/asset'


/**
 * AssetService constructor
 */
export interface AssetServiceConstructor {
  /**
   * @param dataManager
   */
  new (dataManager: AssetDataManager): AssetService
}


export class AssetService {
  protected readonly dataManager: AssetDataManager

  public constructor(dataManager: AssetDataManager) {
    this.dataManager = dataManager
  }

  /**
   * Get asset by asset location
   *
   * @param location
   */
  public locate(location: AssetLocation): AssetDataItem | null {
    return this.dataManager.locate(location)
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
   * @param type    asset type
   * @param offset  start index
   * @param limit   size of results
   */
  public fetchAssets(type: AssetType, offset = 0, limit = -1): AssetDataItem[] {
    const dataMap: AssetDataMap = this.dataManager.toDataMap()
    const uuids = dataMap.uuids[type]

    invariant(uuids != null, `Unknown assetType (${ type })`)

    let result: AssetDataItem[]
    if (limit < 0) {
      result = uuids.map(uuid => dataMap.entities[uuid])
    } else if (limit === 0) {
      result = []
    } else {
      result = uuids
        .slice(offset, offset + limit)
        .map(uuid => dataMap.entities[uuid])
    }

    return result
  }
}
