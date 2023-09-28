import type {
  IAsset,
  IAssetLocatePlugin,
  IAssetLocatedData,
  IAssetMeta,
  IAssetParsePlugin,
  IAssetPluginLocateApi,
  IAssetPluginLocateInput,
  IAssetPluginLocateNext,
  IAssetPluginLocateOutput,
  IAssetPluginParseApi,
  IAssetPluginParseInput,
  IAssetPluginParseNext,
  IAssetPluginParseOutput,
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetPolishPlugin,
  IAssetResolvedData,
  IAssetResolver,
  IAssetResolverApi,
  IAssetResolverPlugin,
} from '@guanghechen/asset-types'
import type { IReporter } from '@guanghechen/types'
import path from 'node:path'

interface ILocateStageData {
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

type IPolishStageData = IAssetResolvedData

export interface IAssetResolverProps {
  reporter: IReporter
}

export class AssetResolver implements IAssetResolver {
  protected readonly _reporter: IReporter
  private readonly _locatePlugins: IAssetLocatePlugin[]
  private readonly _parsePlugins: IAssetParsePlugin[]
  private readonly _polishPlugins: IAssetPolishPlugin[]

  constructor(props: IAssetResolverProps) {
    this._reporter = props.reporter
    this._locatePlugins = []
    this._parsePlugins = []
    this._polishPlugins = []
  }

  public use(plugin: IAssetResolverPlugin): this {
    if (plugin.displayName) {
      if (plugin.locate) this._locatePlugins.push(plugin as IAssetLocatePlugin)
      if (plugin.parse) this._parsePlugins.push(plugin as IAssetParsePlugin)
      if (plugin.polish) this._polishPlugins.push(plugin as IAssetPolishPlugin)
    }
    return this
  }

  public async resolve(
    absoluteSrcPaths: ReadonlyArray<string>,
    api: IAssetResolverApi,
  ): Promise<IAssetResolvedData[]> {
    const reporter: IReporter = this._reporter

    // locate stage
    const locate = async (inputs: ReadonlyArray<string>): Promise<ILocateStageData[]> => {
      const errors: unknown[] = []
      const outputs: ILocateStageData[] = []

      await Promise.all(
        inputs.map((absoluteSrcPath: string): Promise<void> => {
          return this.locate(absoluteSrcPath, api)
            .then(result => {
              if (result !== null) {
                const filename: string = path.basename(absoluteSrcPath)
                outputs.push({
                  absoluteSrcPath,
                  asset: result,
                  filename,
                  encoding: result.encoding,
                })
              } else {
                reporter.warn(
                  '[AssetResolver.resolve] locate stage got null, absoluteSrcPath: {}.',
                  absoluteSrcPath,
                )
              }
            })
            .catch(error => {
              reporter.error(
                '[AssetResolver.resolve] locate stage failed, absoluteSrcPath: {}.\nerror:',
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
    const parse = async (inputs: ILocateStageData[]): Promise<IParseStageData[]> => {
      const errors: unknown[] = []
      const outputs: IParseStageData[] = []

      await Promise.all(
        inputs.map(stageData =>
          this._parse(stageData, api)
            .then(result => {
              if (result !== null) outputs.push(result)
              else {
                reporter.warn(
                  '[AssetResolver.resolve] parse stage got null, absoluteSrcPath: {}.',
                  stageData.absoluteSrcPath,
                )
              }
            })
            .catch(error => {
              reporter.error(
                '[AssetResolver.resolve] parse stage failed, absoluteSrcPath: {}.\nerror:',
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
                  '[AssetResolver.resolve] polish stage got null, absoluteSrcPath: {}.',
                  stageData.absoluteSrcPath,
                )
              }
            })
            .catch(error => {
              reporter.error(
                '[AssetResolver.resolve] polish stage failed, absoluteSrcPath: {}.\nerror:',
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

    const locateOutputs: ILocateStageData[] = await locate(absoluteSrcPaths)
    const parseOutputs: IParseStageData[] = await parse(locateOutputs)
    const polishOutputs: IPolishStageData[] = await polish(parseOutputs)
    return polishOutputs
  }

  public async locate(
    absoluteSrcPath: string,
    api: IAssetResolverApi,
  ): Promise<IAssetLocatedData | null> {
    if (!api.pathResolver.isSafeAbsolutePath(absoluteSrcPath)) return null

    const asset: IAsset | null = await api.locator.locateAsset(absoluteSrcPath)
    if (asset !== null) {
      const encoding: BufferEncoding | undefined = await api.detectEncoding(absoluteSrcPath)
      return { ...asset, encoding }
    }

    const input: IAssetPluginLocateInput | null = await api.initAsset(absoluteSrcPath)
    if (input === null) return null

    const { guid, hash, extname } = input

    const curDir: string = path.dirname(absoluteSrcPath)
    const pluginApi: IAssetPluginLocateApi = {
      loadContent: async relativePath => {
        const refPath: string | null = api.resolveRefPath(curDir, relativePath)
        return refPath === null ? null : api.loadContent(refPath)
      },
      resolveSlug: (meta: Readonly<IAssetMeta>) => api.uriResolver.resolveSlug(meta),
      resolveUri: (sourcetype, mimetype) =>
        api.uriResolver.resolveUri({ guid, sourcetype, mimetype, extname }),
    }

    const reducer: IAssetPluginLocateNext = this._locatePlugins.reduceRight<IAssetPluginLocateNext>(
      (next, middleware) => embryo => middleware.locate(input, embryo, pluginApi, next),
      embryo => embryo,
    )

    const result: IAssetPluginLocateOutput | null = await reducer(null)
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
    return { ...resolvedAsset, encoding: input.encoding }
  }

  protected async _parse(
    locateStageData: ILocateStageData,
    api: IAssetResolverApi,
  ): Promise<IParseStageData | null> {
    const { asset, absoluteSrcPath, filename, encoding } = locateStageData
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
      embryo => embryo,
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

        const refAsset: IAsset | null = await this.locate(refPath, api)
        if (refAsset === null) return null

        const { uri, slug, title } = refAsset
        return { uri, slug, title }
      },
    }
    const reducer: IAssetPluginPolishNext = this._polishPlugins.reduceRight<IAssetPluginPolishNext>(
      (next, middleware) => embryo => middleware.polish(input, embryo, pluginApi, next),
      embryo => embryo,
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
