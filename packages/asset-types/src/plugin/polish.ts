import type { IAsset } from '../asset'
import type { AssetDataType } from '../enum'

export interface IAssetPluginPolishApi {
  /**
   * Load source content.
   * @param pathRelativeToCurDir the path relative to the parent path of the current resource.
   */
  loadContent(pathRelativeToCurDir: string): Promise<Buffer | null>
  /**
   * Resolve asset by locationId.
   * @param locationId
   */
  resolveAsset(locationId: string): Readonly<Pick<IAsset, 'uri' | 'slug' | 'title'>> | null
}

export interface IAssetPluginPolishNext {
  (embryo: Readonly<IAssetPluginPolishOutput> | null):
    | IAssetPluginPolishOutput
    | null
    | Promise<IAssetPluginPolishOutput | null>
}

export interface IAssetPluginPolish {
  (
    input: Readonly<IAssetPluginPolishInput>,
    embryo: Readonly<IAssetPluginPolishOutput> | null,
    api: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): IAssetPluginPolishOutput | null | Promise<IAssetPluginPolishOutput | null>
}

export interface IAssetPluginPolishInput<D = unknown> {
  /**
   * Asset type.
   */
  type: string
  /**
   * Asset tittle.
   */
  title: string
  /**
   * The source file name which can be used to locate this asset by `api.loadContent(filename)`.
   */
  filename: string
  /**
   * Asset data.
   */
  data: D | null
}

export interface IAssetPluginPolishOutput<D = unknown> {
  /**
   * Asset data type.
   */
  dataType: AssetDataType
  /**
   * Asset data.
   */
  data: D | Promise<D>
  /**
   * Which charset should the output data take.
   */
  encoding?: BufferEncoding
}
