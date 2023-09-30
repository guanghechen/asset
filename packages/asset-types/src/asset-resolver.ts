import type { IAsset } from './asset'
import type { IAssetResolverApi } from './asset-resolver-api'
import type {
  IAssetParsePlugin,
  IAssetPlugin,
  IAssetPolishPlugin,
  IAssetResolvePlugin,
} from './asset-resolver-plugin/plugin'
import type { AssetDataTypeEnum } from './enum'

export type IAssetResolverPlugin = IAssetPlugin &
  Partial<IAssetResolvePlugin> &
  Partial<IAssetParsePlugin> &
  Partial<IAssetPolishPlugin>

export interface IAssetResolvedData {
  asset: IAsset
  /**
   * Source file encoding.
   */
  encoding: BufferEncoding | undefined
}

export interface IAssetProcessedData {
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
   * Resolve assets and process them.
   * @param absoluteSrcPaths
   * @param api
   */
  process(
    absoluteSrcPaths: ReadonlyArray<string>,
    api: IAssetResolverApi,
  ): Promise<IAssetProcessedData[]>

  /**
   * Locate asset by srcPath.
   * @param absoluteSrcPath
   * @param api
   */
  locate(absoluteSrcPath: string, api: IAssetResolverApi): Promise<IAsset | null>
}
