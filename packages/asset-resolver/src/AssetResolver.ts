import type {
  IAsset,
  IAssetMeta,
  IAssetParsePlugin,
  IAssetPluginParseApi,
  IAssetPluginParseInput,
  IAssetPluginParseNext,
  IAssetPluginParseOutput,
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetPluginResolveApi,
  IAssetPluginResolveInput,
  IAssetPluginResolveNext,
  IAssetPluginResolveOutput,
  IAssetPolishPlugin,
  IAssetProcessedData,
  IAssetResolvePlugin,
  IAssetResolvedData,
  IAssetResolver,
  IAssetResolverApi,
  IAssetResolverPlugin,
} from '@guanghechen/asset-types'
import type { IReporter } from '@guanghechen/types'
import path from 'node:path'

interface IResolveStageData {
  asset: IAsset
  absoluteSrcPath: string
  filename: string
  encoding: BufferEncoding | undefined
}

interface IParseStageData {
  asset: IAsset
  absoluteSrcPath: string
  filename: string
  data: unknown
  encoding: BufferEncoding | undefined
}

type IPolishStageData = IAssetProcessedData

export interface IAssetResolverProps {
  reporter: IReporter
}

export class AssetResolver implements IAssetResolver {
  protected readonly _reporter: IReporter
  private readonly _resolvePlugins: IAssetResolvePlugin[]
  private readonly _parsePlugins: IAssetParsePlugin[]
  private readonly _polishPlugins: IAssetPolishPlugin[]

  constructor(props: IAssetResolverProps) {
    this._reporter = props.reporter
    this._resolvePlugins = []
    this._parsePlugins = []
    this._polishPlugins = []
  }

  public use(plugin: IAssetResolverPlugin): this {
    if (plugin.displayName) {
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

    // resolve stage
    const resolve = async (inputs: ReadonlyArray<string>): Promise<IResolveStageData[]> => {
      const errors: unknown[] = []
      const outputs: IResolveStageData[] = []

      await Promise.all(
        inputs.map((absoluteSrcPath: string): Promise<void> => {
          return this._resolve(absoluteSrcPath, api)
            .then(result => {
              if (result !== null) {
                const filename: string = path.basename(absoluteSrcPath)
                outputs.push({
                  absoluteSrcPath,
                  asset: result.asset,
                  filename,
                  encoding: result.encoding,
                })
              } else {
                reporter.warn(
                  '[AssetResolver.process] [resolve] got null, absoluteSrcPath: {}.',
                  absoluteSrcPath,
                )
              }
            })
            .catch(error => {
              reporter.error(
                '[AssetResolver.process] [resolve] failed, absoluteSrcPath: {}.\nerror:',
                absoluteSrcPath,
                error,
              )
              errors.push(error)
            })
        }),
      )

      // rethrow error
      if (errors.length > 0) throw errors

      return outputs
    }

    // parse stage
    const parse = async (inputs: IResolveStageData[]): Promise<IParseStageData[]> => {
      const errors: unknown[] = []
      const outputs: IParseStageData[] = []

      await Promise.all(
        inputs.map(stageData =>
          this._parse(stageData, api)
            .then(result => {
              if (result !== null) outputs.push(result)
              else {
                reporter.warn(
                  '[AssetResolver.process] [parse] got null, absoluteSrcPath: {}.',
                  stageData.absoluteSrcPath,
                )
              }
            })
            .catch(error => {
              reporter.error(
                '[AssetResolver.process] [parse] failed, absoluteSrcPath: {}.\nerror:',
                stageData.absoluteSrcPath,
                error,
              )
              errors.push(error)
            }),
        ),
      )

      // rethrow error
      if (errors.length > 0) throw errors

      return outputs
    }

    // polish stage
    const polish = async (inputs: IParseStageData[]): Promise<IPolishStageData[]> => {
      const outputs: IPolishStageData[] = []
      const errors: unknown[] = []
      await Promise.all(
        inputs.map(stageData =>
          this._polish(stageData, api)
            .then(result => {
              if (result !== null) outputs.push(result)
              else {
                reporter.warn(
                  '[AssetResolver.process] [polish] got null, absoluteSrcPath: {}.',
                  stageData.absoluteSrcPath,
                )
              }
            })
            .catch(error => {
              reporter.error(
                '[AssetResolver.process] [polish] failed, absoluteSrcPath: {}.\nerror:',
                stageData.absoluteSrcPath,
                error,
              )
              errors.push(error)
            }),
        ),
      )

      // rethrow error
      if (errors.length > 0) throw errors
      return outputs
    }

    const resolveOutputs: IResolveStageData[] = await resolve(absoluteSrcPaths)
    const parseOutputs: IParseStageData[] = await parse(resolveOutputs)
    const polishOutputs: IPolishStageData[] = await polish(parseOutputs)
    return polishOutputs
  }

  public async locate(absoluteSrcPath: string, api: IAssetResolverApi): Promise<IAsset | null> {
    const resolvedData: IAssetResolvedData | null = await this._resolve(absoluteSrcPath, api)
    return resolvedData?.asset ?? null
  }

  protected async _resolve(
    absoluteSrcPath: string,
    api: IAssetResolverApi,
  ): Promise<IAssetResolvedData | null> {
    if (!api.pathResolver.isSafeAbsolutePath(absoluteSrcPath)) return null

    const asset: IAsset | null = await api.locator.locateAsset(absoluteSrcPath)
    if (asset !== null) {
      const encoding: BufferEncoding | undefined = await api.detectEncoding(absoluteSrcPath)
      return { asset, encoding }
    }

    const input: IAssetPluginResolveInput | null = await api.initAsset(absoluteSrcPath)
    if (input === null) return null

    const { guid, hash, extname } = input

    const curDir: string = path.dirname(absoluteSrcPath)
    const pluginApi: IAssetPluginResolveApi = {
      loadContent: async relativePath => {
        const refPath: string | null = api.resolveRefPath(curDir, relativePath)
        return refPath === null ? null : api.loadContent(refPath)
      },
      resolveSlug: (meta: Readonly<IAssetMeta>) => api.uriResolver.resolveSlug(meta),
      resolveUri: (sourcetype, mimetype) =>
        api.uriResolver.resolveUri({ guid, sourcetype, mimetype, extname }),
    }

    const reducer: IAssetPluginResolveNext =
      this._resolvePlugins.reduceRight<IAssetPluginResolveNext>(
        (next, middleware) => embryo => middleware.resolve(input, embryo, pluginApi, next),
        async embryo => embryo,
      )

    const result: IAssetPluginResolveOutput | null = await reducer(null)
    if (result === null) return null

    const {
      sourcetype,
      mimetype,
      title,
      description,
      slug,
      createdAt,
      updatedAt,
      categories,
      tags,
    } = result
    const uri: string =
      result.uri ?? (await api.uriResolver.resolveUri({ guid, sourcetype, mimetype, extname }))
    const resolvedAsset: IAsset = {
      guid,
      hash,
      sourcetype,
      mimetype,
      extname,
      title,
      description,
      uri,
      slug,
      createdAt,
      updatedAt,
      categories,
      tags,
    }
    await api.locator.insertAsset(absoluteSrcPath, resolvedAsset)
    return { asset: resolvedAsset, encoding: input.encoding }
  }

  protected async _parse(
    resolveStageData: IResolveStageData,
    api: IAssetResolverApi,
  ): Promise<IParseStageData | null> {
    const { asset, absoluteSrcPath, filename, encoding } = resolveStageData
    const input: IAssetPluginParseInput = {
      sourcetype: asset.sourcetype,
      title: asset.title,
      filename,
      extname: asset.extname,
      encoding,
    }

    const curDir: string = path.dirname(absoluteSrcPath)
    const pluginApi: IAssetPluginParseApi = {
      loadContent: async relativePath => {
        const refPath: string | null = api.resolveRefPath(curDir, relativePath)
        return refPath === null ? null : api.loadContent(refPath)
      },
      resolveSlug: (meta: Readonly<IAssetMeta>) => api.uriResolver.resolveSlug(meta),
    }
    const reducer: IAssetPluginParseNext = this._parsePlugins.reduceRight<IAssetPluginParseNext>(
      (next, middleware) => embryo => middleware.parse(input, embryo, pluginApi, next),
      async embryo => embryo,
    )

    const result: IAssetPluginParseOutput | null = await reducer(null)
    return {
      asset,
      absoluteSrcPath,
      filename,
      data: result?.data ?? null,
      encoding: input.encoding,
    }
  }

  protected async _polish(
    parseStageData: IParseStageData,
    api: IAssetResolverApi,
  ): Promise<IPolishStageData | null> {
    const { absoluteSrcPath, asset, filename, data } = parseStageData
    const input: IAssetPluginPolishInput = {
      sourcetype: asset.sourcetype,
      title: asset.title,
      filename,
      data,
    }

    const curDir: string = path.dirname(absoluteSrcPath)
    const pluginApi: IAssetPluginPolishApi = {
      loadContent: async relativePath => {
        const refPath: string | null = api.resolveRefPath(curDir, relativePath)
        return refPath === null ? null : api.loadContent(refPath)
      },
      resolveAssetMeta: async relativePath => {
        const refPath: string | null = api.resolveRefPath(curDir, relativePath)
        if (refPath === null) return null

        const refAsset: IAssetResolvedData | null = await this._resolve(refPath, api)
        if (refAsset === null) return null

        const { uri, slug, title } = refAsset.asset
        return { uri, slug, title }
      },
    }
    const reducer: IAssetPluginPolishNext = this._polishPlugins.reduceRight<IAssetPluginPolishNext>(
      (next, middleware) => embryo => middleware.polish(input, embryo, pluginApi, next),
      async embryo => embryo,
    )

    const result: IAssetPluginPolishOutput | null = await reducer(null)
    if (result === null) return null
    return {
      asset,
      datatype: result.datatype,
      data: result.data,
      encoding: parseStageData.encoding,
    }
  }
}
