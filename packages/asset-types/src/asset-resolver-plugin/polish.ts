import type { IAssetMeta } from '../asset'
import type { IBinaryFileData } from '../asset-file'
import type { AssetDataTypeEnum } from '../enum'

export interface IAssetPluginPolishApi {
  /**
   * Load source content.
   * @param srcPathRelativeToCurDir the path relative to the parent path of the current resource.
   */
  loadContent(srcPathRelativeToCurDir: string): Promise<IBinaryFileData | null>
  /**
   * Resolve asset by srcPathId.
   * @param srcPathId
   */
  resolveAssetMeta(srcPathId: string): Promise<Readonly<IAssetMeta> | null>
}

export interface IAssetPluginPolishNext {
  (
    embryo: Readonly<IAssetPluginPolishOutput> | null,
  ): IAssetPluginPolishOutput | null | Promise<IAssetPluginPolishOutput | null>
}

export interface IAssetPluginPolishInput<D = unknown> {
  /**
   * Asset source content type.
   */
  sourcetype: string
  /**
   * Asset tittle.
   */
  title: string
  /**
   * The source file name.
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
  datatype: AssetDataTypeEnum
  /**
   * Asset data.
   */
  data: D
}
