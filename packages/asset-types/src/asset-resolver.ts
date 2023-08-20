import type { IAssetDataMap } from './asset-manager'
import type { IAssetResolverApi } from './asset-resolver-api'
import type {
  IAssetLocatePlugin,
  IAssetParsePlugin,
  IAssetPlugin,
  IAssetPolishPlugin,
} from './plugin/plugin'

export type IAssetResolverPlugin = IAssetPlugin &
  Partial<IAssetLocatePlugin> &
  Partial<IAssetParsePlugin> &
  Partial<IAssetPolishPlugin>

export interface IAssetResolver {
  /**
   * Use asset plugins.
   * @param plugins
   */
  use(...plugins: Array<IAssetResolverPlugin | IAssetResolverPlugin[]>): this
  /**
   * Export asset data map.
   */
  dump(): IAssetDataMap
  /**
   * Create assets on the given locations.
   * @param locations
   */
  create(assetResolverApi: IAssetResolverApi, locations: string[]): Promise<void>
  /**
   * Mark the assets on the locations invalid and remove them from assetManager.
   * @param locations
   */
  remove(assetResolverApi: IAssetResolverApi, locations: string[]): Promise<void>
}
