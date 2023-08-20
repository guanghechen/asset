import type { IAssetPluginLocate } from './locate'
import type { IAssetPluginParse } from './parse'
import type { IAssetPluginPolish } from './polish'

export interface IAssetPlugin {
  /**
   * Plugin name, it's better to keep it unique.
   */
  readonly displayName: string
}

/**
 * Hooks for resolve asset meta data, like slug, title and etc.
 */
export interface IAssetLocatePlugin extends IAssetPlugin {
  locate: IAssetPluginLocate
}

/**
 * Hooks for parsing asset to specific data.
 */
export interface IAssetParsePlugin extends IAssetPlugin {
  parse: IAssetPluginParse
}

/**
 * Hooks for post-handling parsed data.
 */
export interface IAssetPolishPlugin extends IAssetPlugin {
  polish: IAssetPluginPolish
}
