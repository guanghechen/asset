import type { IAsset, IAssetDataMap, IAssetManager } from '@guanghechen/asset-core'
import invariant from '@guanghechen/invariant'
import type { IAssetEntity } from './types/asset'
import type { IAssetResolver } from './types/asset-resolver'
import type { IAssetService } from './types/asset-service'
import type { IAssetPlugin } from './types/plugin/plugin'
import type {
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
} from './types/plugin/polish'
import type {
  IAssetPluginResolveApi,
  IAssetPluginResolveInput,
  IAssetPluginResolveNext,
} from './types/plugin/resolve'

export interface IAssetServiceProps {
  assetResolver: IAssetResolver
}

export class AssetService implements IAssetService {
  protected readonly assetManager: IAssetManager = null as any
  protected readonly assetResolver: IAssetResolver
  protected readonly locationMap: Map<string, IAssetEntity | null> = new Map()
  protected readonly plugins: IAssetPlugin[] = []

  constructor(props: IAssetServiceProps) {
    const { assetResolver } = props
    this.assetResolver = assetResolver
  }

  public use(plugin: IAssetPlugin): void {
    this.plugins.push(plugin)
  }

  public dump(): IAssetDataMap {
    return this.assetManager.dump()
  }

  public invalidate(locations: string): void {
    const { assetResolver, locationMap } = this
    for (const location of locations) {
      const key = assetResolver.identifyLocation(location)
      locationMap.delete(key)
    }
  }

  public async process(locations: string[]): Promise<void> {
    for (const location of locations) await this._assetResolve(location)
    for (const location of locations) await this._assetPolish(location)
  }

  protected async _assetResolve(location: string): Promise<void> {
    const { assetResolver, locationMap } = this
    const locationId = assetResolver.identifyLocation(location)

    if (locationMap.has(locationId)) return
    locationMap.set(locationId, null)

    const input: IAssetPluginResolveInput | null = await assetResolver.initAsset(location)
    if (input == null) return

    const api: IAssetPluginResolveApi = {
      loadContent: assetResolver.loadSrcContent.bind(assetResolver),
      resolveSlug: assetResolver.resolveSlug.bind(assetResolver),
    }
    const reducer: IAssetPluginResolveNext = this.plugins
      .filter(plugin => !!plugin.resolve)
      .reduceRight<IAssetPluginResolveNext>(
        (next, middleware) => embryo => middleware.resolve!(embryo, api, next),
        () => null,
      )

    const { guid, hash, src } = input
    const result = await reducer(input)
    if (result) {
      const { type, mimetype, title, extname, slug, createdAt, updatedAt, categories, tags, data } =
        result
      const asset: IAsset = {
        guid,
        hash,
        type,
        mimetype,
        title,
        uri: assetResolver.resolveUri({ guid, type, extname }),
        slug,
        createdAt,
        updatedAt,
        categories,
        tags,
      }
      const assetEntity: IAssetEntity = { ...asset, src, data }
      this.assetManager.insert(asset)
      locationMap.set(locationId, assetEntity)
    }
  }

  protected async _assetPolish(location: string): Promise<void> {
    const { assetResolver, locationMap } = this
    const locationId = assetResolver.identifyLocation(location)
    const asset = locationMap.get(locationId)
    invariant(asset != null, `Cannot find asset by the given location (${location}).`)

    const api: IAssetPluginPolishApi = {
      loadContent: assetResolver.loadSrcContent.bind(assetResolver),
      resolveAsset: relativeLocation => {
        const resolvedLocation = assetResolver.resolveLocation(location, relativeLocation)
        const locationId = assetResolver.identifyLocation(resolvedLocation)
        const asset = locationMap.get(locationId)
        return asset ? { uri: asset.uri, slug: asset.slug, title: asset.title } : null
      },
    }
    const reducer: IAssetPluginPolishNext = this.plugins
      .filter(plugin => !!plugin.polish)
      .reduceRight<IAssetPluginPolishNext>(
        (next, middleware) => embryo => middleware.polish!(embryo, api, next),
        () => null,
      )
    const input: IAssetPluginPolishInput = {
      type: asset.type,
      title: asset.title,
      data: asset.data,
    }

    const result = await reducer(input)
    if (result) {
      const { dataType, data, encoding } = result
      await assetResolver.saveAsset({ uri: asset.uri, dataType, data, encoding })
    }
  }
}
