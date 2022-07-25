import type { IAssetEntity } from '../asset'
import type { AssetDataType, IBuffer } from '../misc'

export interface IAssetPluginPolishApi {
  /**
   * Load source content.
   * @param srcLocation
   */
  loadContent(srcLocation: string): Promise<IBuffer>
  /**
   * Resolve asset by source location.
   * @param relativeLocation
   */
  resolveAsset(
    relativeLocation: string,
  ): Promise<Pick<IAssetEntity, 'uri' | 'slug' | 'title'> | null>
}

export interface IAssetPluginPolishNext {
  (embryo: IAssetPluginPolishInput):
    | IAssetPluginPolishOutput
    | null
    | Promise<IAssetPluginPolishOutput | null>
}

export interface IAssetPluginPolish {
  (embryo: IAssetPluginPolishInput, api: IAssetPluginPolishApi, next: IAssetPluginPolishNext):
    | IAssetPluginPolishOutput
    | null
    | Promise<IAssetPluginPolishOutput | null>
}

export interface IAssetPluginPolishInput {
  /**
   * Asset type.
   */
  type: string
  /**
   * Asset tittle.
   */
  title: string
  /**
   * Asset data.
   */
  data: unknown | null
}

export interface IAssetPluginPolishOutput {
  /**
   * Asset data type.
   */
  dataType: AssetDataType
  /**
   * Asset data.
   */
  data: unknown | Promise<unknown>
  /**
   * Which charset should the output data take.
   */
  encoding?: BufferEncoding
}
