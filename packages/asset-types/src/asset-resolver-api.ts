import type { IBinaryFileData } from './asset-file'
import type { IAssetLocator } from './asset-locator'
import type { IAssetPathResolver } from './asset-path-resolver'
import type { IAssetSourceStorage } from './asset-storage-source'
import type { IAssetUriResolver } from './asset-uri-resolver'

export interface IAssetResolverApi {
  readonly locator: IAssetLocator
  readonly pathResolver: IAssetPathResolver
  readonly sourceStorage: IAssetSourceStorage
  readonly uriResolver: IAssetUriResolver

  /**
   * Detect file encoding.
   * @param src
   * @param data
   */
  detectEncoding(src: string, data: IBinaryFileData): Promise<BufferEncoding | undefined>

  /**
   * Resolve the refPath to an absolute filepath as long as the result is under the source storage
   * root dir, otherwise, a null will be returned..
   * @param curDir
   * @param srcPath
   */
  resolveRefPath(curDir: string, refPath: string): Promise<string | null>
}
