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
  /**
   * Source virtual filepath (*nix style).
   */
  src: string
  filename: string
  data: unknown | null
}

export class AssetResolver implements IAssetResolver {
  protected readonly assetManager: IAssetManager
  protected readonly locationMap: Map<string, IAssetWithLocation | null> = new Map()
  protected readonly plugins: IAssetResolverPlugin[] = []

  constructor(props: IAssetResolverProps = {}) {
    this.assetManager = props.assetManager ?? new AssetManager()
  }

  public use(...plugins: Array<IAssetResolverPlugin | IAssetResolverPlugin[]>): this {
    for (const plugin of plugins.flat()) {
      if (plugin.displayName) {
        this.plugins.push(plugin)
      }
    }
    return this
  }

  public dump(): IAssetDataMap {
    return this.assetManager.dump()
  }

  public async create(assetResolverApi: IAssetResolverApi, locations: string[]): Promise<void> {
    await Promise.all(locations.map(location => this._locate(assetResolverApi, location)))
    await Promise.all(locations.map(location => this._parse(assetResolverApi, location)))
    await Promise.all(locations.map(location => this._polish(assetResolverApi, location)))
  }

  public async remove(assetResolverApi: IAssetResolverApi, locations: string[]): Promise<void> {
    const { assetManager, locationMap } = this
    for (const location of locations) {
      const locationId = assetResolverApi.normalizeLocation(location)
      const asset = locationMap.get(locationId)
      if (asset) {
        assetManager.remove(asset.guid)
        locationMap.delete(locationId)
      }
    }
  }

  protected async _locate(assetResolverApi: IAssetResolverApi, location: string): Promise<void> {
    const { locationMap } = this
    const locationId = assetResolverApi.normalizeLocation(location)

    if (locationMap.has(locationId)) return
    locationMap.set(locationId, null)

    const input: IAssetPluginLocateInput | null = await assetResolverApi.initAsset(location)
    if (input == null) return

    const { guid, hash, src, extname } = input
    const api: IAssetPluginLocateApi = {
      loadContent: relativeSrcLocation => {
        const resolvedLocation = assetResolverApi.resolveSrcLocation(
          location,
          '..',
          relativeSrcLocation,
        )
        return assetResolverApi.loadSrcContent(resolvedLocation)
      },
      resolveSlug: assetResolverApi.resolveSlug.bind(assetResolverApi),
      resolveUri: (type, mimetype) =>
        assetResolverApi.resolveUri({ guid, type, mimetype, extname }),
    }

    const reducer: IAssetPluginLocateNext = this.plugins
      .filter((plugin): plugin is IAssetLocatePlugin => !!plugin.locate)
      .reduceRight<IAssetPluginLocateNext>(
        (next, middleware) => embryo => middleware.locate(input, embryo, api, next),
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
      const resolvedUri = uri ?? assetResolverApi.resolveUri({ guid, type, mimetype, extname })
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
      this.assetManager.insert(asset)
      locationMap.set(locationId, { ...asset, filename: input.filename, src, data: null })
    }
  }

  protected async _parse(assetResolverApi: IAssetResolverApi, location: string): Promise<void> {
    const locationId = assetResolverApi.normalizeLocation(location)
    const asset = this.locationMap.get(locationId)
    if (!asset) return

    const api: IAssetPluginParseApi = {
      loadContent: relativeSrcLocation => {
        const resolvedLocation = assetResolverApi.resolveSrcLocation(
          location,
          '..',
          relativeSrcLocation,
        )
        return assetResolverApi.loadSrcContent(resolvedLocation)
      },
      resolveSlug: assetResolverApi.resolveSlug.bind(assetResolverApi),
    }
    const input: IAssetPluginParseInput = {
      type: asset.type,
      title: asset.title,
      filename: asset.filename,
    }

    const reducer: IAssetPluginParseNext = this.plugins
      .filter((plugin): plugin is IAssetParsePlugin => !!plugin.parse)
      .reduceRight<IAssetPluginParseNext>(
        (next, middleware) => embryo => middleware.parse(input, embryo, api, next),
        embryo => embryo,
      )
    const result = await reducer(null)

    if (result) {
      const { data } = result
      asset.data = data
    }
  }

  protected async _polish(assetResolverApi: IAssetResolverApi, location: string): Promise<void> {
    const { locationMap } = this
    const locationId = assetResolverApi.normalizeLocation(location)
    const asset = locationMap.get(locationId)
    if (!asset) return

    const api: IAssetPluginPolishApi = {
      loadContent: relativeSrcLocation => {
        const resolvedLocation = assetResolverApi.resolveSrcLocation(
          location,
          '..',
          relativeSrcLocation,
        )
        return assetResolverApi.loadSrcContent(resolvedLocation)
      },
      resolveAsset: relativeLocation => {
        const resolvedLocation = assetResolverApi.resolveSrcLocation(
          location,
          '..',
          decodeURIComponent(relativeLocation),
        )
        const locationId = assetResolverApi.normalizeLocation(resolvedLocation)
        const asset = locationMap.get(locationId)
        return asset ? { uri: asset.uri, slug: asset.slug, title: asset.title } : null
      },
    }
    const input: IAssetPluginPolishInput = {
      type: asset.type,
      title: asset.title,
      filename: asset.filename,
      data: asset.data,
    }

    const reducer: IAssetPluginPolishNext = this.plugins
      .filter((plugin): plugin is IAssetPolishPlugin => !!plugin.polish)
      .reduceRight<IAssetPluginPolishNext>(
        (next, middleware) => embryo => middleware.polish(input, embryo, api, next),
        embryo => embryo,
      )
    const result = await reducer(null)

    if (result) {
      const { dataType, data, encoding } = result
      await assetResolverApi.saveAsset({ uri: asset.uri, dataType, data, encoding })
    }
  }
}
