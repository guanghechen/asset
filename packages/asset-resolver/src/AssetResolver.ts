import type {
  IAsset,
  IAssetLocatePlugin,
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
  srcPath: string
}

interface IParseStageData {
  asset: IAsset
  srcPath: string
  filename: string
  data: unknown
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

  public use(...plugins: Array<IAssetResolverPlugin | IAssetResolverPlugin[]>): this {
    for (const plugin of plugins.flat()) {
      if (!plugin.displayName) continue
      if (plugin.locate) this._locatePlugins.push(plugin as IAssetLocatePlugin)
      if (plugin.parse) this._parsePlugins.push(plugin as IAssetParsePlugin)
      if (plugin.polish) this._polishPlugins.push(plugin as IAssetPolishPlugin)
    }
    return this
  }

  public async resolve(srcPaths: string[], api: IAssetResolverApi): Promise<IAssetResolvedData[]> {
    // locate stage
    const locateStageDataList: ILocateStageData[] = []
    await Promise.all(
      srcPaths.map(srcPath =>
        this._locate(srcPath, api).then(result => {
          if (result !== null) locateStageDataList.push(result)
          else {
            this._reporter.warn(
              '[AssetResolver.resolve] locate stage got null, srcPath({})',
              srcPath,
            )
          }
        }),
      ),
    )

    // parse stage
    const parseStageDataList: IParseStageData[] = []
    await Promise.all(
      locateStageDataList.map(stageData =>
        this._parse(stageData, api).then(result => {
          if (result !== null) parseStageDataList.push(result)
          else {
            this._reporter.warn(
              '[AssetResolver.resolve] parse stage got null, srcPath({})',
              stageData.srcPath,
            )
          }
        }),
      ),
    )

    // polish stage
    const polishStageDataList: IPolishStageData[] = []
    await Promise.all(
      parseStageDataList.map(stageData =>
        this._polish(stageData, api).then(result => {
          if (result !== null) polishStageDataList.push(result)
          else {
            this._reporter.warn(
              '[AssetResolver.resolve] polish stage got null, srcPath({})',
              stageData.srcPath,
            )
          }
        }),
      ),
    )

    return polishStageDataList
  }

  protected async _locate(
    srcPath: string,
    api: IAssetResolverApi,
  ): Promise<ILocateStageData | null> {
    const asset: IAsset | null | undefined = await api.locateAsset(srcPath)
    if (asset !== undefined) {
      if (asset === null) return null
      return { asset, srcPath: srcPath }
    }
    await api.insertAsset(srcPath, null)

    const input: IAssetPluginLocateInput | null = await api.initAsset(srcPath)
    if (input === null) return null

    const { guid, hash, extname } = input
    const pluginApi: IAssetPluginLocateApi = {
      loadContent: async relativePath => {
        if (!api.isRelativePath(relativePath)) return null
        return api.loadContent(`${srcPath}/../${relativePath}`)
      },
      resolveSlug: slug => api.resolveSlug(slug),
      resolveUri: (type, mimetype) => api.resolveUri({ guid, type, mimetype, extname }),
    }

    const reducer: IAssetPluginLocateNext = this._locatePlugins.reduceRight<IAssetPluginLocateNext>(
      (next, middleware) => embryo => middleware.locate(input, embryo, pluginApi, next),
      embryo => embryo,
    )

    const result: IAssetPluginLocateOutput | null = await reducer(null)
    if (result === null) return null

    const { type, mimetype, title, description, slug, createdAt, updatedAt, categories, tags } =
      result
    const uri: string = result.uri ?? (await api.resolveUri({ guid, type, mimetype, extname }))
    const resolvedAsset: IAsset = {
      guid,
      hash,
      type,
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
    await api.insertAsset(srcPath, resolvedAsset)
    return { asset: resolvedAsset, srcPath: srcPath }
  }

  protected async _parse(
    locateStageData: ILocateStageData,
    api: IAssetResolverApi,
  ): Promise<IParseStageData | null> {
    const { asset, srcPath } = locateStageData
    const filename: string = path.basename(srcPath)
    const input: IAssetPluginParseInput = { type: asset.type, title: asset.title, filename }
    const pluginApi: IAssetPluginParseApi = {
      loadContent: async relativePath => {
        if (!api.isRelativePath(relativePath)) return null
        return api.loadContent(`${srcPath}/../${relativePath}`)
      },
      resolveSlug: slug => api.resolveSlug(slug),
    }
    const reducer: IAssetPluginParseNext = this._parsePlugins.reduceRight<IAssetPluginParseNext>(
      (next, middleware) => embryo => middleware.parse(input, embryo, pluginApi, next),
      embryo => embryo,
    )

    const result: IAssetPluginParseOutput | null = await reducer(null)
    return { asset, srcPath: srcPath, filename, data: result?.data ?? null }
  }

  protected async _polish(
    parseStageData: IParseStageData,
    api: IAssetResolverApi,
  ): Promise<IPolishStageData | null> {
    const { srcPath, asset, filename, data } = parseStageData
    const input: IAssetPluginPolishInput = { type: asset.type, title: asset.title, filename, data }
    const pluginApi: IAssetPluginPolishApi = {
      loadContent: async relativePath => {
        if (!api.isRelativePath(relativePath)) return null
        return api.loadContent(`${srcPath}/../${relativePath}`)
      },
      resolveAssetMeta: async relativePath => {
        if (!api.isRelativePath(relativePath)) return null
        const locateStageData: ILocateStageData | null = await this._locate(
          `${srcPath}/../${decodeURIComponent(relativePath)}`,
          api,
        )
        if (locateStageData === null) return null
        const { uri, slug, title } = locateStageData.asset
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
      encoding: result.encoding,
    }
  }
}
