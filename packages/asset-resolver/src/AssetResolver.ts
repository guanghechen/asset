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

    // locate stage
    const locate = async (inputs: ReadonlyArray<string>): Promise<IAssetPluginLocateResult[]> => {
      const errors: unknown[] = []
      const results: IAssetPluginLocateResult[] = []

      await Promise.all(
        inputs.map((absoluteSrcPath: string): Promise<void> => {
          return this._locate(absoluteSrcPath, api)
            .then(result => {
              if (result !== null) results.push(result)
              else {
                reporter.warn(
                  '[AssetResolver.process] [locate] got null, absoluteSrcPath: {}.',
                  absoluteSrcPath,
                )
              }
            })
            .catch(error => {
              reporter.error(
                '[AssetResolver.process] [locate] failed, absoluteSrcPath: {}.\nerror:',
                absoluteSrcPath,
                error,
              )
              errors.push(error)
            })
        }),
      )

      // rethrow error
      if (errors.length > 0) throw errors
      return results
    }

    // resolve stage
    const resolve = async (
      inputs: IAssetPluginLocateResult[],
    ): Promise<IAssetPluginResolveResult[]> => {
      const errors: unknown[] = []
      const results: IAssetPluginResolveResult[] = []

      await Promise.all(
        inputs.map(lastStageResult => {
          return this._resolve(lastStageResult, api)
            .then(result => {
              if (result !== null) results.push(result)
              else {
                reporter.warn(
                  '[AssetResolver.process] [resolve] got null, absoluteSrcPath: {}.',
                  lastStageResult.absoluteSrcPath,
                )
              }
            })
            .catch(error => {
              reporter.error(
                '[AssetResolver.process] [resolve] failed, absoluteSrcPath: {}.\nerror:',
                lastStageResult.absoluteSrcPath,
                error,
              )
              errors.push(error)
            })
        }),
      )

      // rethrow error
      if (errors.length > 0) throw errors
      return results
    }

    // parse stage
    const parse = async (
      inputs: IAssetPluginResolveResult[],
    ): Promise<IAssetPluginParseResult[]> => {
      const errors: unknown[] = []
      const results: IAssetPluginParseResult[] = []

      await Promise.all(
        inputs.map(lastStageResult =>
          this._parse(lastStageResult, api)
            .then(result => {
              if (result !== null) results.push(result)
              else {
                reporter.warn(
                  '[AssetResolver.process] [parse] got null, absoluteSrcPath: {}.',
                  lastStageResult.absoluteSrcPath,
                )
              }
            })
            .catch(error => {
              reporter.error(
                '[AssetResolver.process] [parse] failed, absoluteSrcPath: {}.\nerror:',
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

    // polish stage
    const polish = async (
      inputs: IAssetPluginParseResult[],
    ): Promise<IAssetPluginPolishResult[]> => {
      const errors: unknown[] = []
      const results: IAssetPluginPolishResult[] = []

      await Promise.all(
        inputs.map(lastStageResult =>
          this._polish(lastStageResult, api)
            .then(result => {
              if (result !== null) results.push(result)
              else {
                reporter.warn(
                  '[AssetResolver.process] [polish] got null, absoluteSrcPath: {}.',
                  lastStageResult.absoluteSrcPath,
                )
              }
            })
            .catch(error => {
              reporter.error(
                '[AssetResolver.process] [polish] failed, absoluteSrcPath: {}.\nerror:',
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

    const locateResults: IAssetPluginLocateResult[] = await locate(absoluteSrcPaths)
    const resolveResults: IAssetPluginResolveResult[] = await resolve(locateResults)
    const parseResults: IAssetPluginParseResult[] = await parse(resolveResults)
    const polishResults: IAssetPluginPolishResult[] = await polish(parseResults)
    const results: IAssetProcessedData[] = polishResults.map(polishResult => ({
      asset: polishResult.asset,
      datatype: polishResult.datatype,
      data: polishResult.data,
      encoding: polishResult.encoding,
    }))
    return results
  }

  public async resolve(absoluteSrcPath: string, api: IAssetResolverApi): Promise<IAsset | null> {
    const locateResult = await this._locate(absoluteSrcPath, api)
    if (locateResult === null) return null

    const asset: IAsset | null = await api.locator.findAssetByGuid(locateResult.guid)
    if (asset !== null && asset.hash === locateResult.hash) return asset

    const resolveResult = await this._resolve(locateResult, api)
    if (resolveResult === null) return null

    await api.locator.insertAsset(absoluteSrcPath, resolveResult.asset)
    return resolveResult.asset
  }

  protected async _locate(
    absoluteSrcPath: string,
    api: IAssetResolverApi,
  ): Promise<IAssetPluginLocateResult | null> {
    const args: IAssetPluginLocateArgs = { absoluteSrcPath }
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
    return result
  }

  protected async _parse(
    lastStageResult: IAssetPluginResolveResult,
    api: IAssetResolverApi,
  ): Promise<IAssetPluginParseResult | null> {
    const loadContent = (absoluteSrcPath: string): Promise<IBinaryFileData | null> =>
      this._loadContent(absoluteSrcPath, api)
    const args: IAssetPluginParseArgs = { lastStageResult, loadContent }
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
    const resolveAssetMeta = (absoluteSrcPath: string): Promise<IAssetMeta | null> =>
      this._resolveAssetMeta(absoluteSrcPath, api)
    const args: IAssetPluginPolishArgs = { lastStageResult, loadContent, resolveAssetMeta }
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

    const result: IAssetPluginLocateResult | null = await this._locate(absoluteSrcPath, api)
    if (result === null) return null
    return result.content
  }

  protected async _resolveAssetMeta(
    absoluteSrcPath: string,
    api: IAssetResolverApi,
  ): Promise<IAssetMeta | null> {
    const asset: IAsset | null = await this.resolve(absoluteSrcPath, api)
    if (asset === null) return null
    const { uri, slug } = asset
    return { uri, slug }
  }
}
