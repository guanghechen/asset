import type { IAssetPluginParse } from './parse'
import type { IAssetPluginPolish } from './polish'

/**
 * Asset plugin lifecycle
 *
 *    - Parse
 *    - Polish
 */
export interface IAssetPlugin {
  /**
   * Plugin display name.
   */
  readonly displayName: string
  /**
   * A hook for parsing asset to specific data.
   */
  parse?: IAssetPluginParse
  /**
   * A hook for normalizing parsed data.
   */
  polish?: IAssetPluginPolish
}
