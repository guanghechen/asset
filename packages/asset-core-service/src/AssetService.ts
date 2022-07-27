import type { IAsset, IAssetDataMap, IAssetManager } from '@guanghechen/asset-core'
import { AssetManager } from '@guanghechen/asset-core'
import path from 'path'
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
  assetManager?: IAssetManager
}

export class AssetService implements IAssetService {
  protected readonly assetManager: IAssetManager
  protected readonly locationMap: Map<string, IAssetEntity | null> = new Map()
  protected readonly plugins: IAssetPlugin[] = []

  constructor(props: IAssetServiceProps = {}) {
    this.assetManager = props.assetManager ?? new AssetManager()
  }

  public use(...plugins: Array<IAssetPlugin | IAssetPlugin[]>): this {
    for (const plugin of plugins.flat()) {
      if (plugin?.displayName) {
        this.plugins.push(plugin)
      }
    }
    return this
  }

  public dump(): IAssetDataMap {
    return this.assetManager.dump()
  }

  public async create(assetResolver: IAssetResolver, locations: string[]): Promise<void> {
    for (const location of locations) await this._assetResolve(assetResolver, location)
    for (const location of locations) await this._assetPolish(assetResolver, location)
  }

  public remove(assetResolver: IAssetResolver, locations: string[]): void {
    const { assetManager, locationMap } = this
    for (const location of locations) {
      const locationId = assetResolver.identifyLocation(location)
      const asset = locationMap.get(locationId)
      if (asset) {
        assetManager.remove(asset.guid)
        locationMap.delete(locationId)
      }
    }
  }

  protected async _assetResolve(assetResolver: IAssetResolver, location: string): Promise<void> {
    const { locationMap } = this
    const locationId = assetResolver.identifyLocation(location)

    if (locationMap.has(locationId)) return
    locationMap.set(locationId, null)

    const input: IAssetPluginResolveInput | null = await assetResolver.initAsset(location)
    if (input == null) return

    const api: IAssetPluginResolveApi = {
      loadContent: relativeSrcLocation => {
        const resolvedLocation = assetResolver.resolveLocation(
          path.dirname(location),
          relativeSrcLocation,
        )
        return assetResolver.loadSrcContent(resolvedLocation)
      },
      loadContentSync(relativeSrcLocation) {
        const resolvedLocation = assetResolver.resolveLocation(
          path.dirname(location),
          relativeSrcLocation,
        )
        return assetResolver.loadSrcContentSync(resolvedLocation)
      },
      resolveSlug: assetResolver.resolveSlug.bind(assetResolver),
    }
    const reducer: IAssetPluginResolveNext = this.plugins
      .filter(plugin => !!plugin.resolve)
      .reduceRight<IAssetPluginResolveNext>(
        (next, middleware) => embryo => middleware.resolve!(input, embryo, api, next),
        embryo => embryo,
      )

    const { guid, hash, src } = input
    const result = await reducer(null)
    if (result) {
      const { type, mimetype, title, slug, createdAt, updatedAt, categories, tags, data } = result
      const asset: IAsset = {
        guid,
        hash,
        type,
        mimetype,
        title,
        uri: assetResolver.resolveUri({ guid, type, mimetype }),
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

  protected async _assetPolish(assetResolver: IAssetResolver, location: string): Promise<void> {
    const { locationMap } = this
    const locationId = assetResolver.identifyLocation(location)
    const asset = locationMap.get(locationId)
    if (asset == null) return

    const api: IAssetPluginPolishApi = {
      loadContent: relativeSrcLocation => {
        const resolvedLocation = assetResolver.resolveLocation(
          path.dirname(location),
          relativeSrcLocation,
        )
        return assetResolver.loadSrcContent(resolvedLocation)
      },
      loadContentSync(relativeSrcLocation) {
        const resolvedLocation = assetResolver.resolveLocation(
          path.dirname(location),
          relativeSrcLocation,
        )
        return assetResolver.loadSrcContentSync(resolvedLocation)
      },
      resolveAsset: relativeLocation => {
        const resolvedLocation = assetResolver.resolveLocation(
          path.dirname(location),
          relativeLocation,
        )
        const locationId = assetResolver.identifyLocation(resolvedLocation)
        const asset = locationMap.get(locationId)
        return asset ? { uri: asset.uri, slug: asset.slug, title: asset.title } : null
      },
    }
    const reducer: IAssetPluginPolishNext = this.plugins
      .filter(plugin => !!plugin.polish)
      .reduceRight<IAssetPluginPolishNext>(
        (next, middleware) => embryo => middleware.polish!(input, embryo, api, next),
        embryo => embryo,
      )
    const input: IAssetPluginPolishInput = {
      type: asset.type,
      title: asset.title,
      data: asset.data,
    }

    const result = await reducer(null)
    if (result) {
      const { dataType, data, encoding } = result
      await assetResolver.saveAsset({ uri: asset.uri, dataType, data, encoding })
    }
  }
}
