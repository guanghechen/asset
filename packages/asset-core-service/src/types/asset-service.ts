import type { IAssetDataMap } from '@guanghechen/asset-core'
import type { IAssetPlugin } from './plugin/plugin'

export interface IAssetService {
  /**
   * Use a asset plugin.
   * @param plugin
   */
  use(plugin: IAssetPlugin): this
  /**
   * Export asset data map.
   */
  dump(): IAssetDataMap
  /**
   * Create assets on the given locations.
   * @param locations
   */
  create(locations: string[]): Promise<void>
  /**
   * Mark the assets on the locations invalid and remove them from assetManager.
   * @param locations
   */
  remove(locations: string[]): void
}