import type {
  IAsset,
  IAssetDataMap,
  IAssetLocatePlugin,
  IAssetManager,
  IAssetParsePlugin,
  IAssetPluginLocateApi,
  IAssetPluginLocateInput,
  IAssetPluginLocateNext,
  IAssetPluginParseApi,
  IAssetPluginParseInput,
  IAssetPluginParseNext,
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPolishPlugin,
  IAssetResolver,
  IAssetResolverApi,
  IAssetResolverPlugin,
} from '@guanghechen/asset-types'
import { AssetManager } from './AssetManager'

export interface IAssetResolverProps {
  assetManager?: IAssetManager
}

interface IAssetWithLocation extends IAsset {
  src: string // Source virtual filepath (*nix style).
  filename: string
  data: unknown | null
}

export class AssetResolver implements IAssetResolver {
  protected readonly _assetManager: IAssetManager
  protected readonly _locationMap: Map<string, IAssetWithLocation | null> = new Map()
  protected readonly _plugins: IAssetResolverPlugin[] = []

  constructor(props: IAssetResolverProps = {}) {
    const { assetManager = new AssetManager() } = props
    this._assetManager = assetManager
  }

  public use(...plugins: Array<IAssetResolverPlugin | IAssetResolverPlugin[]>): this {
    for (const plugin of plugins.flat()) {
      if (plugin.displayName) {
        this._plugins.push(plugin)
      }
    }
    return this
  }

  public async dump(): Promise<IAssetDataMap> {
    return this._assetManager.dump()
  }

  public async create(api: IAssetResolverApi, locations: string[]): Promise<void> {
    await Promise.all(locations.map(location => this._locate(api, location)))
    await Promise.all(locations.map(location => this._parse(api, location)))
    await Promise.all(locations.map(location => this._polish(api, location)))
  }

  public async remove(api: IAssetResolverApi, locations: string[]): Promise<void> {
    const { _assetManager, _locationMap } = this
    for (const location of locations) {
      const locationId = api.normalizeLocation(location)
      const asset = _locationMap.get(locationId)
      if (asset) {
        _assetManager.remove(asset.guid)
        _locationMap.delete(locationId)
        await api.removeAsset(asset.uri)
      }
    }
  }

  public async update(api: IAssetResolverApi, locations: string[]): Promise<void> {
    const { _assetManager, _locationMap } = this
    for (const location of locations) {
      const locationId = api.normalizeLocation(location)
      const asset = _locationMap.get(locationId)
      if (asset) {
        _assetManager.remove(asset.guid)
        _locationMap.delete(locationId)
        // no need to remove asset.
      }
    }

    await Promise.all(locations.map(location => this._locate(api, location)))
    await Promise.all(locations.map(location => this._parse(api, location)))
    await Promise.all(locations.map(location => this._polish(api, location)))
  }

  protected async _locate(api: IAssetResolverApi, location: string): Promise<void> {
    const { _locationMap } = this
    const locationId = api.normalizeLocation(location)

    if (_locationMap.has(locationId)) return
    _locationMap.set(locationId, null)

    const input: IAssetPluginLocateInput | null = await api.initAsset(location)
    if (input == null) return

    const { guid, hash, src, extname } = input
    const pluginApi: IAssetPluginLocateApi = {
      loadContent: relativeSrcLocation => {
        const resolvedLocation = api.resolveSrcLocation(`${location}/../${relativeSrcLocation}`)
        return api.loadSrcContent(resolvedLocation)
      },
      resolveSlug: slug => api.resolveSlug(slug),
      resolveUri: (type, mimetype) => api.resolveUri({ guid, type, mimetype, extname }),
    }

    const reducer: IAssetPluginLocateNext = this._plugins
      .filter((plugin): plugin is IAssetLocatePlugin => !!plugin.locate)
      .reduceRight<IAssetPluginLocateNext>(
        (next, middleware) => embryo => middleware.locate(input, embryo, pluginApi, next),
        embryo => embryo,
      )
    const result = await reducer(null)

    if (result) {
      const {
        type,
        mimetype,
        title,
        description,
        slug,
        uri,
        createdAt,
        updatedAt,
        categories,
        tags,
      } = result
      const resolvedUri: string = uri ?? (await api.resolveUri({ guid, type, mimetype, extname }))
      const asset: IAsset = {
        guid,
        hash,
        type,
        mimetype,
        extname,
        title,
        description,
        uri: resolvedUri,
        slug,
        createdAt,
        updatedAt,
        categories,
        tags,
      }
      this._assetManager.insert(asset)
      _locationMap.set(locationId, { ...asset, filename: input.filename, src, data: null })
    }
  }

  protected async _parse(api: IAssetResolverApi, location: string): Promise<void> {
    const locationId = api.normalizeLocation(location)
    const asset = this._locationMap.get(locationId)
    if (!asset) return

    const pluginApi: IAssetPluginParseApi = {
      loadContent: relativeSrcLocation => {
        const resolvedLocation = api.resolveSrcLocation(`${location}/../${relativeSrcLocation}`)
        return api.loadSrcContent(resolvedLocation)
      },
      resolveSlug: slug => api.resolveSlug(slug),
    }
    const input: IAssetPluginParseInput = {
      type: asset.type,
      title: asset.title,
      filename: asset.filename,
    }

    const reducer: IAssetPluginParseNext = this._plugins
      .filter((plugin): plugin is IAssetParsePlugin => !!plugin.parse)
      .reduceRight<IAssetPluginParseNext>(
        (next, middleware) => embryo => middleware.parse(input, embryo, pluginApi, next),
        embryo => embryo,
      )
    const result = await reducer(null)

    if (result) {
      const { data } = result
      asset.data = data
    }
  }

  protected async _polish(api: IAssetResolverApi, location: string): Promise<void> {
    const { _locationMap } = this
    const locationId = api.normalizeLocation(location)
    const asset = _locationMap.get(locationId)
    if (!asset) return

    const pluginApi: IAssetPluginPolishApi = {
      loadContent: relativeSrcLocation => {
        const resolvedLocation = api.resolveSrcLocation(`${location}/../${relativeSrcLocation}`)
        return api.loadSrcContent(resolvedLocation)
      },
      resolveAssetMeta: async relativeLocation => {
        const resolvedLocation = api.resolveSrcLocation(
          `${location}/../${decodeURIComponent(relativeLocation)}`,
        )
        const locationId = api.normalizeLocation(resolvedLocation)
        const asset = _locationMap.get(locationId)
        return asset ? { uri: asset.uri, slug: asset.slug, title: asset.title } : null
      },
    }
    const input: IAssetPluginPolishInput = {
      type: asset.type,
      title: asset.title,
      filename: asset.filename,
      data: asset.data,
    }

    const reducer: IAssetPluginPolishNext = this._plugins
      .filter((plugin): plugin is IAssetPolishPlugin => !!plugin.polish)
      .reduceRight<IAssetPluginPolishNext>(
        (next, middleware) => embryo => middleware.polish(input, embryo, pluginApi, next),
        embryo => embryo,
      )
    const result = await reducer(null)

    if (result) {
      const { dataType, data, encoding } = result
      await api.saveAsset({ uri: asset.uri, dataType, data, encoding })
    }
  }
}
