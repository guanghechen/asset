import type { IAssetLocator } from './asset-locator'
import type { IAssetPathResolver } from './asset-path-resolver'
import type { IAssetSourceStorage } from './asset-storage-source'
import type { IAssetUriResolver } from './asset-uri-resolver'
import type { IEncodingDetector } from './encoding-detector'

export interface IAssetResolverApi {
  readonly locator: IAssetLocator
  readonly pathResolver: IAssetPathResolver
  readonly sourceStorage: IAssetSourceStorage
  readonly uriResolver: IAssetUriResolver
  readonly encodingDetector: IEncodingDetector

  /**
   * Resolve the refPath to an absolute filepath as long as the result is under the source storage
   * root dir, otherwise, a null will be returned..
   * @param curDir
   * @param srcPath
   */
  resolveRefPath(curDir: string, refPath: string): Promise<string | null>
}
