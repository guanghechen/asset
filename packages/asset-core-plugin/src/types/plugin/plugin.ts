import type { IAssetPluginParse } from './parse'
import type { IAssetPluginPolish } from './polish'

/**
 * A hook for parsing asset to specific data.
 */
export interface IAssetParsePlugin {
  readonly displayName: string
  parse?: IAssetPluginParse
}

/**
 * A hook for post-handling parsed data.
 */
export interface IAssetPolishPlugin {
  readonly displayName: string
  polish?: IAssetPluginPolish
}
