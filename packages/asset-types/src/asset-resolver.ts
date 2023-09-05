import type { IAsset } from './asset'
import type { IAssetResolverApi } from './asset-resolver-api'
import type { AssetDataType } from './enum'
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

export interface IAssetResolvedData {
  asset: IAsset
  dataType: AssetDataType
  data: unknown
  encoding: BufferEncoding | undefined
}

export interface IAssetResolver {
  /**
   * Use asset plugins.
   * @param plugins
   */
  use(...plugins: Array<IAssetResolverPlugin | IAssetResolverPlugin[]>): this
  /**
   * Resolve assets in the specified srcPaths.
   * @param srcPaths
   * @param api
   */
  resolve(srcPaths: string[], api: IAssetResolverApi): Promise<IAssetResolvedData[]>
}
