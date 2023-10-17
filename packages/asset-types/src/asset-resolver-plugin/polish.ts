import type { IAsset } from '../asset'
import type { IBinaryFileData } from '../asset-file'
import type { AssetDataTypeEnum } from '../enum'

export interface IAssetPluginPolishApi {
  /**
   * Load source content.
   * @param absoluteSrcPath
   */
  loadContent(absoluteSrcPath: string): Promise<IBinaryFileData | null>
  /**
   * Extract src path from url.
   * @param url
   */
  parseSrcPathFromUrl(url: string): string | null
  /**
   * Resolve asset by absoluteSrcPath.
   * @param absoluteSrcPath
   */
  resolveAsset(absoluteSrcPath: string): Promise<Readonly<IAsset> | null>
  /**
   * Resolve src path.
   * @param srcPathRelativeToCurDir the path relative to the parent path of the current resource.
   */
  resolveRefPath(srcPathRelativeToCurDir: string): Promise<string | null>
}

export interface IAssetPluginPolishInput<D = unknown> {
  /**
   * Asset source content type.
   */
  sourcetype: string
  /**
   * Asset content.
   */
  content: IBinaryFileData
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
