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
  dump(): Promise<IAssetDataMap>
  /**
   * Create assets on the given locations.
   * @param api
   * @param locations
   */
  create(api: IAssetResolverApi, locations: string[]): Promise<void>
  /**
   * Mark the assets on the locations invalid and remove them from assetManager.
   * @param api
   * @param locations
   */
  remove(api: IAssetResolverApi, locations: string[]): Promise<void>
  /**
   * Update the assets on the locations.
   * @param api
   * @param locations
   */
  update(api: IAssetResolverApi, locations: string[]): Promise<void>
}
