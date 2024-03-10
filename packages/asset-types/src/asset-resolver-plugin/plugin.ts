import type {
  IAsyncMiddleware,
  IAsyncMiddlewareNext,
  IAsyncMiddlewares,
} from '@guanghechen/middleware'
import type {
  IAssetPluginLocateApi,
  IAssetPluginLocateInput,
  IAssetPluginLocateOutput,
} from './locate'
import type { IAssetPluginParseApi, IAssetPluginParseInput, IAssetPluginParseOutput } from './parse'
import type {
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishOutput,
} from './polish'
import type {
  IAssetPluginResolveApi,
  IAssetPluginResolveInput,
  IAssetPluginResolveOutput,
} from './resolve'

export type IAssetPluginLocateNext = IAsyncMiddlewareNext<IAssetPluginLocateOutput>
export type IAssetPluginLocateMiddleware = IAsyncMiddleware<
  IAssetPluginLocateInput,
  IAssetPluginLocateOutput,
  IAssetPluginLocateApi
>
export type IAssetPluginLocateMiddlewares = IAsyncMiddlewares<
  IAssetPluginLocateInput,
  IAssetPluginLocateOutput,
  IAssetPluginLocateApi
>

export type IAssetPluginResolveNext = IAsyncMiddlewareNext<IAssetPluginResolveOutput>
export type IAssetPluginResolveMiddleware = IAsyncMiddleware<
  IAssetPluginResolveInput,
  IAssetPluginResolveOutput,
  IAssetPluginResolveApi
>
export type IAssetPluginResolveMiddlewares = IAsyncMiddlewares<
  IAssetPluginResolveInput,
  IAssetPluginResolveOutput,
  IAssetPluginResolveApi
>

export type IAssetPluginParseNext = IAsyncMiddlewareNext<IAssetPluginParseOutput>
export type IAssetPluginParseMiddleware = IAsyncMiddleware<
  IAssetPluginParseInput,
  IAssetPluginParseOutput,
  IAssetPluginParseApi
>
export type IAssetPluginParseMiddlewares = IAsyncMiddlewares<
  IAssetPluginParseInput,
  IAssetPluginParseOutput,
  IAssetPluginParseApi
>

export type IAssetPluginPolishNext = IAsyncMiddlewareNext<IAssetPluginPolishOutput>
export type IAssetPluginPolishMiddleware = IAsyncMiddleware<
  IAssetPluginPolishInput,
  IAssetPluginPolishOutput,
  IAssetPluginPolishApi
>
export type IAssetPluginPolishMiddlewares = IAsyncMiddlewares<
  IAssetPluginPolishInput,
  IAssetPluginPolishOutput,
  IAssetPluginPolishApi
>

export interface IAssetPlugin {
  /**
   * Plugin name, it's better to keep it unique.
   */
  readonly displayName: string
}

/**
 * Hooks for locating asset.
 */
export interface IAssetLocatePlugin extends IAssetPlugin {
  locate: IAssetPluginLocateMiddleware
}

/**
 * Hooks for resolve asset meta data, like slug, title and etc.
 */
export interface IAssetResolvePlugin extends IAssetPlugin {
  resolve: IAssetPluginResolveMiddleware
}

/**
 * Hooks for parsing asset to specific data.
 */
export interface IAssetParsePlugin extends IAssetPlugin {
  parse: IAssetPluginParseMiddleware
}

/**
 * Hooks for post-handling parsed data.
 */
export interface IAssetPolishPlugin extends IAssetPlugin {
  polish: IAssetPluginPolishMiddleware
}
