import type { IAssetDataMap } from '@guanghechen/asset-core'
import type { IAssetParserPlugin } from './plugin/plugin'
import type { IAssetResolver } from './resolver'

export interface IAssetParser {
  /**
   * Use asset plugins.
   * @param plugins
   */
  use(...plugins: Array<IAssetParserPlugin | IAssetParserPlugin[]>): this
  /**
   * Export asset data map.
   */
  dump(): IAssetDataMap
  /**
   * Create assets on the given locations.
   * @param locations
   */
  create(assetResolver: IAssetResolver, locations: string[]): Promise<void>
  /**
   * Mark the assets on the locations invalid and remove them from assetManager.
   * @param locations
   */
  remove(assetResolver: IAssetResolver, locations: string[]): void
}
