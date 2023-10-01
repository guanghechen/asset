import type {
  IAsset,
  IAssetLocatePlugin,
  IAssetMeta,
  IAssetParsePlugin,
  IAssetPolishPlugin,
  IAssetProcessedData,
  IAssetResolvePlugin,
  IAssetResolver,
  IAssetResolverApi,
  IAssetResolverPlugin,
  IBinaryFileData,
} from '@guanghechen/asset-types'
import type { IReporter } from '@guanghechen/types'
import {
  type IAssetPluginLocateArgs,
  type IAssetPluginLocateResult,
  locate,
} from './plugins/locate'
import { type IAssetPluginParseArgs, type IAssetPluginParseResult, parse } from './plugins/parse'
import {
  type IAssetPluginPolishArgs,
  type IAssetPluginPolishResult,
  polish,
} from './plugins/polish'
import {
  type IAssetPluginResolveArgs,
  type IAssetPluginResolveResult,
  resolve,
} from './plugins/resolve'

export interface IAssetResolverProps {
  reporter: IReporter
}

export class AssetResolver implements IAssetResolver {
  protected readonly _reporter: IReporter
  private readonly _locatePlugins: IAssetLocatePlugin[]
  private readonly _resolvePlugins: IAssetResolvePlugin[]
  private readonly _parsePlugins: IAssetParsePlugin[]
  private readonly _polishPlugins: IAssetPolishPlugin[]

  constructor(props: IAssetResolverProps) {
    this._reporter = props.reporter
    this._locatePlugins = []
    this._resolvePlugins = []
    this._parsePlugins = []
    this._polishPlugins = []
  }

  public use(plugin: IAssetResolverPlugin): this {
    if (plugin.displayName) {
      if (plugin.locate) this._locatePlugins.push(plugin as IAssetLocatePlugin)
      if (plugin.resolve) this._resolvePlugins.push(plugin as IAssetResolvePlugin)
      if (plugin.parse) this._parsePlugins.push(plugin as IAssetParsePlugin)
      if (plugin.polish) this._polishPlugins.push(plugin as IAssetPolishPlugin)
    }
    return this
  }

  public async process(
    absoluteSrcPaths: ReadonlyArray<string>,
    api: IAssetResolverApi,
  ): Promise<IAssetProcessedData[]> {
    const reporter: IReporter = this._reporter

    const stage = async <
      T1 extends
        | IAssetPluginLocateArgs
        | IAssetPluginLocateResult
        | IAssetPluginResolveResult
        | IAssetPluginParseResult,
      T2 extends
        | IAssetPluginLocateResult
        | IAssetPluginResolveResult
        | IAssetPluginParseResult
        | IAssetPluginPolishResult,
    >(
      stageName: 'locate' | 'resolve' | 'parse' | 'polish',
      lastStageResults: T1[],
      fn: (lastStageResult: T1) => Promise<T2 | null>,
    ): Promise<T2[]> => {
      const errors: unknown[] = []
      const results: T2[] = []

      await Promise.all(
        lastStageResults.map(lastStageResult =>
          fn(lastStageResult)
            .then(result => {
              if (result !== null) results.push(result)
              else {
                reporter.warn(
                  '[AssetResolver.process] [{}] got null, absoluteSrcPath: {}.',
                  stageName,
                  lastStageResult.absoluteSrcPath,
                )
              }
            })
            .catch(error => {
              reporter.error(
                '[AssetResolver.process] [{}] failed, absoluteSrcPath: {}.\nerror:',
                stageName,
                lastStageResult.absoluteSrcPath,
                error,
              )
              errors.push(error)
            }),
        ),
      )

      // rethrow error
      if (errors.length > 0) throw errors
      return results
    }

    const locateArgs: IAssetPluginLocateArgs[] = absoluteSrcPaths.map(absoluteSrcPath => ({
      absoluteSrcPath,
    }))

    // locate stage
    const locateResults: IAssetPluginLocateResult[] = await stage<
      IAssetPluginLocateArgs,
      IAssetPluginLocateResult
    >('locate', locateArgs, input => this._locate(input, api))

    // resolve stage
    const resolveResults: IAssetPluginResolveResult[] = await stage<
      IAssetPluginLocateResult,
      IAssetPluginResolveResult
    >('resolve', locateResults, input => this._resolve(input, api))

    // parse stage
    const parseResults: IAssetPluginParseResult[] = await stage<
      IAssetPluginResolveResult,
      IAssetPluginParseResult
    >('parse', resolveResults, input => this._parse(input, api))

    // polish stage
    const polishResults: IAssetPluginPolishResult[] = await stage<
      IAssetPluginParseResult,
      IAssetPluginPolishResult
    >('polish', parseResults, input => this._polish(input, api))

    const results: IAssetProcessedData[] = polishResults.map(polishResult => ({
      asset: polishResult.asset,
      datatype: polishResult.datatype,
      data: polishResult.data,
      encoding: polishResult.encoding,
    }))
    return results
  }

  public async resolve(absoluteSrcPath: string, api: IAssetResolverApi): Promise<IAsset | null> {
    const args: IAssetPluginLocateArgs = { absoluteSrcPath }
    const locateResult = await this._locate(args, api)
    if (locateResult === null) return null

    const asset: IAsset | null = await api.locator.findAssetByGuid(locateResult.guid)
    if (asset !== null && asset.hash === locateResult.hash) return { ...asset }

    const resolveResult = await this._resolve(locateResult, api)
    if (resolveResult === null) return null
    return { ...resolveResult.asset }
  }

  protected async _locate(
    args: IAssetPluginLocateArgs,
    api: IAssetResolverApi,
  ): Promise<IAssetPluginLocateResult | null> {
    const plugins: IAssetLocatePlugin[] = this._locatePlugins
    const result: IAssetPluginLocateResult | null = await locate(args, plugins, api)
    return result
  }

  protected async _resolve(
    lastStageResult: IAssetPluginLocateResult,
    api: IAssetResolverApi,
  ): Promise<IAssetPluginResolveResult | null> {
    const loadContent = (absoluteSrcPath: string): Promise<IBinaryFileData | null> =>
      this._loadContent(absoluteSrcPath, api)
    const args: IAssetPluginResolveArgs = { lastStageResult, loadContent }
    const plugins: IAssetResolvePlugin[] = this._resolvePlugins
    const result: IAssetPluginResolveResult | null = await resolve(args, plugins, api)
    if (result === null) return null

    await api.locator.insertAsset(lastStageResult.absoluteSrcPath, result.asset)
    return result
  }

  protected async _parse(
    lastStageResult: IAssetPluginResolveResult,
    api: IAssetResolverApi,
  ): Promise<IAssetPluginParseResult | null> {
    const loadContent = (absoluteSrcPath: string): Promise<IBinaryFileData | null> =>
      this._loadContent(absoluteSrcPath, api)
    const resolveAsset = (absoluteSrcPath: string): Promise<IAsset | null> =>
      this.resolve(absoluteSrcPath, api)
    const args: IAssetPluginParseArgs = { lastStageResult, loadContent, resolveAsset }
    const plugins: IAssetParsePlugin[] = this._parsePlugins
    const result: IAssetPluginParseResult | null = await parse(args, plugins, api)
    return result
  }

  protected async _polish(
    lastStageResult: IAssetPluginParseResult,
    api: IAssetResolverApi,
  ): Promise<IAssetPluginPolishResult | null> {
    const loadContent = (absoluteSrcPath: string): Promise<IBinaryFileData | null> =>
      this._loadContent(absoluteSrcPath, api)
    const resolveAsset = (absoluteSrcPath: string): Promise<IAsset | null> =>
      this.resolve(absoluteSrcPath, api)
    const args: IAssetPluginPolishArgs = { lastStageResult, loadContent, resolveAsset }
    const plugins: IAssetPolishPlugin[] = this._polishPlugins
    const result: IAssetPluginPolishResult | null = await polish(args, plugins, api)
    return result
  }

  protected async _loadContent(
    absoluteSrcPath: string,
    api: IAssetResolverApi,
  ): Promise<IBinaryFileData | null> {
    api.pathResolver.assertSafeAbsolutePath(absoluteSrcPath)
    await api.sourceStorage.assertExistedFile(absoluteSrcPath)

    const args: IAssetPluginLocateArgs = { absoluteSrcPath }
    const result: IAssetPluginLocateResult | null = await this._locate(args, api)
    if (result === null) return null
    return result.content
  }
}
