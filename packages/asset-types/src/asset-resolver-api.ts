import type { IBinaryFileData } from './asset-file'
import type { IAssetLocator } from './asset-locator'
import type { IAssetPathResolver } from './asset-path-resolver'
import type { IAssetPluginLocateInput } from './asset-resolver-plugin/locate'
import type { IAssetUriResolver } from './asset-uri-resolver'

export interface IAssetResolverApi {
  readonly locator: IAssetLocator
  readonly pathResolver: IAssetPathResolver
  readonly uriResolver: IAssetUriResolver

  /**
   * Detect file encoding.
   * @param absoluteSrcPath
   */
  detectEncoding(absoluteSrcPath: string): Promise<BufferEncoding | undefined>

  /**
   * Create an initial asset.
   * @param absoluteSrcPath
   */
  initAsset(absoluteSrcPath: string): Promise<IAssetPluginLocateInput | null>

  /**
   * Load content by source file srcPath.
   * @param absoluteSrcPath
   */
  loadContent(absoluteSrcPath: string): Promise<IBinaryFileData | null>

  /**
   * Resolve the refPath to an absolute filepath as long as the result is under the source storage
   * root dir, otherwise, a null will be returned..
   * @param curDir
   * @param srcPath
   */
  resolveRefPath(curDir: string, refPath: string): string | null
}
