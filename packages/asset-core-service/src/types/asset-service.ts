import type { IAssetDataMap } from '@guanghechen/asset-core'
import type { IAssetPlugin } from './plugin/plugin'

export interface IAssetService {
  /**
   * Use a asset plugin.
   * @param plugin
   */
  use(plugin: IAssetPlugin): void
  /**
   * Export asset data map.
   */
  dump(): IAssetDataMap
  /**
   * Mark the assets on the locations invalid.
   * @param locations
   */
  invalidate(locations: string): void
  /**
   * Process assets on the given locations.
   * @param locations
   */
  process(locations: string[]): Promise<void>
}
