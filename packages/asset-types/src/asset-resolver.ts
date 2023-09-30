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
  locate(absoluteSrcPath: string, api: IAssetResolverApi): Promise<IAssetLocatedData | null>
}
