import type { IAssetPluginParse } from './parse'
import type { IAssetPluginPolish } from './polish'

export interface IAssetPlugin {
  /**
   * Plugin name, it's better to keep it unique.
   */
  readonly displayName: string
}

/**
 * A hook for parsing asset to specific data.
 */
export interface IAssetParsePlugin extends IAssetPlugin {
  parse: IAssetPluginParse
}

/**
 * A hook for post-handling parsed data.
 */
export interface IAssetPolishPlugin extends IAssetPlugin {
  polish: IAssetPluginPolish
}
