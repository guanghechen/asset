import type { IAssetResolverApi } from './asset-resolver-api'
import type { IAssetResolverLocator } from './asset-resolver-locator'
import type {
  IAssetLocatePlugin,
  IAssetParsePlugin,
  IAssetPlugin,
  IAssetPolishPlugin,
} from './plugin/plugin'
import type { IAssetPluginPolishOutput } from './plugin/polish'

export type IAssetResolverPlugin = IAssetPlugin &
  Partial<IAssetLocatePlugin> &
  Partial<IAssetParsePlugin> &
  Partial<IAssetPolishPlugin>

export interface IAssetResolvedData extends IAssetPluginPolishOutput {
  uri: string
}

export interface IAssetResolver {
  /**
   * Use asset plugins.
   * @param plugins
   */
  use(...plugins: Array<IAssetResolverPlugin | IAssetResolverPlugin[]>): this
  /**
   *
   * @param api
   * @param locations
   */
  resolve(
    locations: string[],
    locator: IAssetResolverLocator,
    api: IAssetResolverApi,
  ): Promise<Array<IAssetResolvedData | null>>
}
