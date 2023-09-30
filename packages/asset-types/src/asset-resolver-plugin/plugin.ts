import type {
  IAssetPluginLocateApi,
  IAssetPluginLocateInput,
  IAssetPluginLocateNext,
  IAssetPluginLocateOutput,
} from './locate'
import type {
  IAssetPluginParseApi,
  IAssetPluginParseInput,
  IAssetPluginParseNext,
  IAssetPluginParseOutput,
} from './parse'
import type {
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
} from './polish'
import type {
  IAssetPluginResolveApi,
  IAssetPluginResolveInput,
  IAssetPluginResolveNext,
  IAssetPluginResolveOutput,
} from './resolve'

export interface IAssetPlugin {
  /**
   * Plugin name, it's better to keep it unique.
   */
  readonly displayName: string
}

export interface IAssetLocatePlugin extends IAssetPlugin {
  locate(
    input: Readonly<IAssetPluginLocateInput>,
    embryo: Readonly<IAssetPluginLocateOutput> | null,
    api: Readonly<IAssetPluginLocateApi>,
    next: IAssetPluginLocateNext,
  ): IAssetPluginLocateOutput | null | Promise<IAssetPluginLocateOutput | null>
}

/**
 * Hooks for resolve asset meta data, like slug, title and etc.
 */
export interface IAssetResolvePlugin extends IAssetPlugin {
  resolve(
    input: Readonly<IAssetPluginResolveInput>,
    embryo: Readonly<IAssetPluginResolveOutput> | null,
    api: Readonly<IAssetPluginResolveApi>,
    next: IAssetPluginResolveNext,
  ): IAssetPluginResolveOutput | null | Promise<IAssetPluginResolveOutput | null>
}

/**
 * Hooks for parsing asset to specific data.
 */
export interface IAssetParsePlugin extends IAssetPlugin {
  parse(
    input: Readonly<IAssetPluginParseInput>,
    embryo: Readonly<IAssetPluginParseOutput> | null,
    api: Readonly<IAssetPluginParseApi>,
    next: IAssetPluginParseNext,
  ): IAssetPluginParseOutput | null | Promise<IAssetPluginParseOutput | null>
}

/**
 * Hooks for post-handling parsed data.
 */
export interface IAssetPolishPlugin extends IAssetPlugin {
  polish(
    input: Readonly<IAssetPluginPolishInput>,
    embryo: Readonly<IAssetPluginPolishOutput> | null,
    api: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): IAssetPluginPolishOutput | null | Promise<IAssetPluginPolishOutput | null>
}
