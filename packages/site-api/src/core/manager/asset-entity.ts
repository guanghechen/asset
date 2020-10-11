import fs from 'fs-extra'
import { writeJSON } from '../../util/fs'
import { resolveLocalPath } from '../../util/path'
import type { AssetUUID } from '../entity/_types'
import type { AssetEntity } from '../entity/asset'


/**
 * Manage AssetEntities
 */
export class AssetEntityManager<T extends AssetEntity<any>> {
  protected dataRoot: string

  public constructor(dataRoot: string) {
    this.dataRoot = dataRoot
  }

  /**
   * Find AssetEntity by uuid
   *
   * @param uuid
   */
  public find(uuid: string): T | null {
    const filepath: string = this.calcFilepath(uuid)
    if (!fs.existsSync(filepath)) return null
    const entity: T = fs.readJsonSync(filepath)
    return entity
  }

  /**
   * Write AssetEntity into data file
   *
   * @param asset
   */
  public async insert(asset: AssetEntity): Promise<void> {
    const filepath: string = this.calcFilepath(asset.uuid)
    await writeJSON(filepath, asset)
  }

  /**
   * Calc post data file path by post.uuid
   *
   * @param uuid    uuid of PostEntity
   */
  protected calcFilepath(uuid: AssetUUID): string {
    const filepath = resolveLocalPath(this.dataRoot, uuid + '.json')
    return filepath
  }
}
