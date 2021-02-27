import type { AssetUUID, TagUUID } from '../entity/_types'
import type { RawTagDataItem, TagDataItem, TagDataMap } from '../entity/tag'
import fs from 'fs-extra'
import invariant from 'tiny-invariant'
import { writeJSON } from '../../util/fs'
import { uniqueText } from '../../util/hash'
import { stringify } from '../../util/string'

/**
 * Only export no side-effect funcs from TagDataManager
 */
export type ImmutableTagDataManager = Pick<TagDataManager, 'find' | 'normalize'>

/**
 * TagDataManager constructor
 */
export interface TagDataManagerConstructor {
  /**
   * @param dataMapFilepath filepath of TagDataMap
   */
  new (dataMapFilepath: string): TagDataManager
}

export class TagDataManager {
  protected readonly dataMapFilepath: string
  protected readonly uuids: TagUUID[]
  protected readonly dataMap: Record<TagUUID, TagDataItem>

  public constructor(dataMapFilepath: string) {
    this.dataMapFilepath = dataMapFilepath
    this.uuids = []
    this.dataMap = {}
  }

  /**
   * Load tag data map from tagDataMap filepath
   */
  public async load(): Promise<void> {
    const data: TagDataMap = await fs.readJSON(this.dataMapFilepath)
    ;(this.uuids as TagUUID[]) = data.uuids
    ;(this.dataMap as Record<TagUUID, TagDataItem>) = data.entities
  }

  /**
   * Output tag data map into tagDataMap file
   */
  public async dump(): Promise<void> {
    const data: TagDataMap = this.toDataMap()
    await writeJSON(this.dataMapFilepath, data)
  }

  /**
   * Return tag data map
   */
  public toDataMap(): TagDataMap {
    const data: TagDataMap = {
      uuids: this.uuids,
      entities: this.dataMap,
    }
    return data
  }

  /**
   * Formatting TagDataItem
   *
   * @param tag
   */
  public normalize(tag: RawTagDataItem): TagDataItem {
    const title: string = typeof tag === 'string' ? tag : tag.uuid
    const uuid: TagUUID = uniqueText(title)

    invariant(uuid != null, `Bad uuid. tag(${stringify(tag)})`)

    let result: TagDataItem = this.dataMap[uuid]

    // Create a new one if it's not exist
    if (result == null) {
      result = {
        uuid,
        title,
        assets: [],
        ...(typeof tag !== 'string' ? tag : undefined),
      }
    }

    return result
  }

  /**
   * Get TagEntity by tag uuid
   *
   * @param uuid
   */
  public find(uuid: TagUUID): TagDataItem | null {
    const result = this.dataMap[uuid]
    if (result == null) return null
    return result
  }

  /**
   * Create a new tag if there is no tag with uuid equals ${tagId}
   *
   * @param tag
   * @param assetUUID   uuid of asset
   */
  public insert(
    tag: Pick<TagDataItem, 'uuid' | 'title'>,
    assetUUID: AssetUUID,
  ): void {
    let current: TagDataItem = this.dataMap[tag.uuid]

    // Create new tag if it is not exists yet.
    if (current == null) {
      current = {
        uuid: tag.uuid,
        title: tag.title,
        assets: [],
      }

      this.dataMap[current.uuid] = current
      this.uuids.push(current.uuid)
    }

    // append asset into the asset list of the tag
    if (!current.assets.includes(assetUUID)) {
      current.assets.push(assetUUID)
    }
  }

  /**
   * Remove asset from the specified tag
   *
   * @param uuid        uuid of tag
   * @param assetUUID   uuid of asset
   */
  public remove(uuid: TagUUID, assetUUID: AssetUUID): void {
    const result = this.dataMap[uuid]
    if (result == null) return
    result.assets = result.assets.filter(asset => asset !== assetUUID)

    if (result.assets.length <= 0) {
      this._drop(uuid)
    }
  }

  /**
   * Drop tag if its asset list is empty.
   *
   * @param uuid
   */
  protected _drop(uuid: TagUUID): void {
    ;(this.uuids as TagUUID[]) = this.uuids.filter(id => id !== uuid)
    this.dataMap[uuid] = undefined as any
  }
}
