import type { IAssetResolverLocator } from './asset-resolver-locator'
import type { IAssetUriResolver } from './asset-uri-resolver'
import type { IAssetPluginLocateInput } from './plugin/locate'

export interface IAssetResolverApi extends IAssetResolverLocator, IAssetUriResolver {
  /**
   * Create an initial asset.
   * @param srcPath
   */
  initAsset(srcPath: string): Promise<IAssetPluginLocateInput | null>
  /**
   *
   * @param srcPath
   */
  isRelativePath(srcPath: string): boolean
  /**
   * Load content by source file srcPath.
   * @param srcPath
   */
  loadContent(srcPath: string): Promise<Buffer | null>
}
