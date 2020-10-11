import crypto from 'crypto'
import fs from 'fs-extra'
import path from 'path'
import invariant from 'tiny-invariant'
import { writeJSON } from '../../util/fs'
import type { AssetLocation, AssetType, AssetUUID } from '../entity/_types'
import type { AssetDataItem, AssetDataMap } from '../entity/asset'


/**
 * Only export no side-effect funcs from AssetDataManager
 */
export type ImmutableAssetDataManager = Pick<AssetDataManager, 'find' | 'locate'>


/**
 * Manage AssetDataItems
 */
export class AssetDataManager {
  protected readonly shouldDesensitize: boolean
  protected readonly workspace: string
  protected readonly dataMapFilepath: string
  protected readonly uuids: Record<AssetType, AssetUUID[]>
  protected readonly locations: Record<AssetLocation, AssetUUID>
  protected readonly dataMap: Record<AssetUUID, AssetDataItem>

  public constructor(
    workspace: string,
    dataMapFilepath: string,
    shouldDesensitize = false
    ) {
    this.shouldDesensitize = shouldDesensitize
    this.workspace = workspace
    this.dataMapFilepath = dataMapFilepath
    this.uuids = {}
    this.locations = {}
    this.dataMap = {}
  }

  /**
   * Load asset data map from assetDataMap filepath
   */
  public async load(): Promise<void> {
    const data: AssetDataMap = await fs.readJSON(this.dataMapFilepath);
    (this.uuids as Record<AssetType, AssetUUID[]>) = data.uuids;
    (this.locations as Record<AssetLocation, AssetUUID>) = data.locations;
    (this.dataMap as Record<AssetUUID, AssetDataItem>) = data.entities
  }

  /**
   * Output asset data map into assetDataMap file
   */
  public async dump(): Promise<void> {
    const data: AssetDataMap = this.toDataMap()
    await writeJSON(this.dataMapFilepath, data)
  }

  /**
   * Return asset data map
   */
  public toDataMap(): AssetDataMap {
    const data: AssetDataMap = {
      uuids: this.uuids,
      locations: this.locations,
      entities: this.dataMap,
    }
    return data
  }

  /**
   * Get AssetEntity by tag uuid
   *
   * @param uuid
   */
  public find(uuid: string): AssetDataItem | null {
    const result = this.dataMap[uuid]
    if (result == null) return null
    return result
  }

  /**
   * Get AssetEntity by asset location
   *
   * @param location
   */
  public locate(location: AssetLocation): AssetDataItem | null {
    const uuid = this.locations[location]
    if (uuid == null) return null
    return this.find(uuid)
  }

  /**
   * Calc asset location
   *
   * @param filepath absolute filepath
   */
  public calcLocation(filepath: string): AssetLocation {
    const location = path
      .normalize(path.relative(this.workspace, filepath))
      .replace(/[\\/]+/g, '/')
      .replace(/[/]$/, '')

    if (this.shouldDesensitize) {
      const sha1 = crypto.createHash('sha1')
      sha1.update(location)
      return sha1.digest('hex')
    }

    return location
  }

  /**
   * Insert asset
   *
   * @param asset
   */
  public insert(asset: AssetDataItem): void {
    invariant(
      this.dataMap[asset.uuid] == null,
      `Duplicated asset uuid (${ asset.uuid })`
    )

    const uuids: AssetUUID[] = this.uuids[asset.type] || []
    uuids.push(asset.uuid)

    this.uuids[asset.type] = uuids
    this.locations[asset.location] = asset.uuid
    this.dataMap[asset.uuid] = asset
  }

  /**
   * Remove asset
   *
   * @param uuid
   */
  public remove(uuid: AssetUUID): void {
    const asset = this.dataMap[uuid]
    if (asset != null) {
      const uuids = this.uuids[asset.type].filter(id => id !== uuid)
      this.uuids[asset.type] = uuids.length <= 0 ? undefined as any : uuids
      this.locations[asset.location] = undefined as any
      this.dataMap[uuid] = undefined as any
    }
  }
}
