import type {
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
  IAssetResolverLocator,
  IAssetResolverPlugin,
  IResolvingAsset as IAssetResolving,
} from '@guanghechen/asset-types'

export class AssetResolver implements IAssetResolver {
  protected readonly _locatePlugins: IAssetLocatePlugin[]
  protected readonly _parsePlugins: IAssetParsePlugin[]
  protected readonly _polishPlugins: IAssetPolishPlugin[]

  constructor() {
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

  public async resolve(
    locations: string[],
    locator: IAssetResolverLocator,
    api: IAssetResolverApi,
  ): Promise<Array<IAssetResolvedData | null>> {
    await Promise.all(locations.map(location => this._locate(location, locator, api)))
    await Promise.all(locations.map(location => this._parse(location, locator, api)))
    const results: Array<IAssetResolvedData | null> = await Promise.all(
      locations.map(location => this._polish(location, locator, api)),
    )
    return results
  }

  protected async _locate(
    location: string,
    locator: IAssetResolverLocator,
    api: IAssetResolverApi,
  ): Promise<IAssetResolving | null> {
    const locationId: string = api.identifyLocation(location)
    const asset: IAssetResolving | null | undefined = await locator.locateAsset(locationId)
    if (asset !== undefined) return asset
    await locator.insertAsset(locationId, null)

    const input: IAssetPluginLocateInput | null = await api.initAsset(location)
    if (input === null) return null

    const { guid, hash, extname } = input
    const pluginApi: IAssetPluginLocateApi = {
      loadContent: async relativeLocation => api.loadContent(`${location}/../${relativeLocation}`),
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
    const resolvingAsset: IAssetResolving = {
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
      filename: input.filename,
      data: null,
    }

    await locator.insertAsset(locationId, resolvingAsset)
    return resolvingAsset
  }

  protected async _parse(
    location: string,
    locator: IAssetResolverLocator,
    api: IAssetResolverApi,
  ): Promise<IAssetPluginParseOutput | null> {
    const locationId: string = api.identifyLocation(location)
    const asset: IAssetResolving | null | undefined = await locator.locateAsset(locationId)
    if (!asset) return null

    const pluginApi: IAssetPluginParseApi = {
      loadContent: async relativeLocation => api.loadContent(`${location}/../${relativeLocation}`),
      resolveSlug: slug => api.resolveSlug(slug),
    }
    const input: IAssetPluginParseInput = {
      type: asset.type,
      title: asset.title,
      filename: asset.filename,
    }

    const reducer: IAssetPluginParseNext = this._parsePlugins.reduceRight<IAssetPluginParseNext>(
      (next, middleware) => embryo => middleware.parse(input, embryo, pluginApi, next),
      embryo => embryo,
    )

    const result: IAssetPluginParseOutput | null = await reducer(null)
    if (result === null) return null

    asset.data = result.data
    return result
  }

  protected async _polish(
    location: string,
    locator: IAssetResolverLocator,
    api: IAssetResolverApi,
  ): Promise<IAssetResolvedData | null> {
    const locationId: string = api.identifyLocation(location)
    const asset: IAssetResolving | null | undefined = await locator.locateAsset(locationId)
    if (!asset) return null

    const pluginApi: IAssetPluginPolishApi = {
      loadContent: async relativeLocation => api.loadContent(`${location}/../${relativeLocation}`),
      resolveAssetMeta: async relativeLocation => {
        const lid: string = api.identifyLocation(
          `${location}/../${decodeURIComponent(relativeLocation)}`,
        )
        const relativeAsset: IAssetResolving | null | undefined = await locator.locateAsset(lid)
        return relativeAsset
          ? { uri: relativeAsset.uri, slug: relativeAsset.slug, title: relativeAsset.title }
          : null
      },
    }
    const input: IAssetPluginPolishInput = {
      type: asset.type,
      title: asset.title,
      filename: asset.filename,
      data: asset.data,
    }

    const reducer: IAssetPluginPolishNext = this._polishPlugins.reduceRight<IAssetPluginPolishNext>(
      (next, middleware) => embryo => middleware.polish(input, embryo, pluginApi, next),
      embryo => embryo,
    )
    const result: IAssetPluginPolishOutput | null = await reducer(null)
    if (result === null) return null
    return { ...result, uri: asset.uri }
  }
}
