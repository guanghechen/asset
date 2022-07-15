import type { IAssetDataMap, IAssetManager } from '@guanghechen/asset-core'
import invariant from '@guanghechen/invariant'
import type { IAssetEntity } from './types/asset'
import type { IAssetResolver } from './types/asset-resolver'
import type { IAssetService } from './types/asset-service'
import type {
  IAssetProcessingMiddleware,
  IMiddlewarePostProcessNext,
  IMiddlewareProcessNext,
} from './types/middleware'

export interface IAssetServiceProps {
  assetResolver: IAssetResolver
}

export class AssetService implements IAssetService {
  protected readonly assetManager: IAssetManager = null as any
  protected readonly assetResolver: IAssetResolver
  protected readonly locationMap: Map<string, IAssetEntity | null> = new Map()
  protected readonly middlewares: IAssetProcessingMiddleware[] = []

  constructor(props: IAssetServiceProps) {
    const { assetResolver } = props
    this.assetResolver = assetResolver
  }

  public use(middleware: IAssetProcessingMiddleware): void {
    this.middlewares.push(middleware)
  }

  public dump(): IAssetDataMap {
    return this.assetManager.toJSON()
  }

  public invalidate(locations: string): void {
    const { assetResolver, locationMap } = this
    for (const location of locations) {
      const key = assetResolver.identifyLocation(location)
      locationMap.delete(key)
    }
  }

  public async handle(locations: string[]): Promise<void> {
    for (const location of locations) await this._process(location)
    for (const location of locations) await this._postProcess(location)
  }

  protected async _process(location: string): Promise<void> {
    const { assetResolver, locationMap } = this
    const locationId = assetResolver.identifyLocation(location)
    if (locationMap.has(locationId)) return

    const initialAsset: IAssetEntity | null = await assetResolver.initAsset(location)
    if (initialAsset == null) {
      locationMap.set(locationId, null)
      return
    }

    const { hash, src, uri, ...initialEmbryo } = initialAsset
    const reducer: IMiddlewareProcessNext = this.middlewares.reduceRight<IMiddlewareProcessNext>(
      (next, middleware) => ctx => middleware.process(ctx, next),
      ctx => ctx.embryo,
    )
    const embryo = await reducer({
      embryo: initialEmbryo,
      resolveSlug: assetResolver.resolveSlug.bind(assetResolver),
    })
    const asset: IAssetEntity = {
      ...embryo,
      hash,
      src,
      uri: assetResolver.resolveUri({
        guid: embryo.guid,
        type: embryo.type,
        extname: embryo.extname,
      }),
    }
    locationMap.set(locationId, asset)
  }

  protected async _postProcess(location: string): Promise<void> {
    const { assetResolver, locationMap } = this
    const locationId = assetResolver.identifyLocation(location)
    const asset = locationMap.get(locationId)
    invariant(asset != null, `Cannot find asset by the given location (${location}).`)

    const reducer: IMiddlewarePostProcessNext =
      this.middlewares.reduceRight<IMiddlewarePostProcessNext>(
        (next, middleware) => ctx => middleware.postProcess(ctx, next),
        ctx => ctx.embryo,
      )
    const embryo = await reducer({
      embryo: { type: asset.type, data: asset.data },
      resolveAsset: (relativeLocation: string): Readonly<IAssetEntity | null> => {
        const resolvedLocation = assetResolver.resolveLocation(location, relativeLocation)
        const locationId = assetResolver.identifyLocation(resolvedLocation)
        const assetEntry0 = locationMap.get(locationId)
        return assetEntry0 ? { ...assetEntry0 } : null
      },
    })
    asset.type = embryo.type
    asset.data = embryo.data
    await assetResolver.saveAsset(asset)
  }
}
