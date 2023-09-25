import type { IAsset } from './asset'
import type { IAssetResolverApi } from './asset-resolver-api'
import type {
  IAssetLocatePlugin,
  IAssetParsePlugin,
  IAssetPlugin,
  IAssetPolishPlugin,
} from './asset-resolver-plugin/plugin'
import type { AssetDataTypeEnum } from './enum'

export type IAssetResolverPlugin = IAssetPlugin &
  Partial<IAssetLocatePlugin> &
  Partial<IAssetParsePlugin> &
  Partial<IAssetPolishPlugin>

export interface IAssetLocatedData extends IAsset {
  /**
   * Source file encoding.
   */
  encoding: BufferEncoding | undefined
}

export interface IAssetResolvedData {
  asset: IAsset
  datatype: AssetDataTypeEnum
  data: unknown
  encoding: BufferEncoding | undefined
}

export interface IAssetResolver {
  /**
   * Use asset resolver plugin.
   * @param plugin
   */
  use(plugin: IAssetResolverPlugin): this
  /**
   * Resolve assets in the specified srcPaths.
   * @param srcPaths
   * @param api
   */
  resolve(srcPaths: string[], api: IAssetResolverApi): Promise<IAssetResolvedData[]>
  /**
   * Locate asset by srcPath.
   * @param srcPath
   * @param api
   */
  locate(srcPath: string, api: IAssetResolverApi): Promise<IAssetLocatedData | null>
}
