import type { IAsset, IAssetEntity, IAssetMeta } from '../types/asset'
import type {
  IAssetMiddleware,
  IAssetMiddlewareContext,
  IAssetMiddlewareNext,
} from '../types/middleware'

export interface IAssetServiceProps {
  initAsset(location: string): Promise<IAsset>
  saveAsset(asset: Readonly<IAsset>): Promise<void> | void
  identifyLocation(location: string): string
  resolveLocation(...locationPieces: string[]): string
  resolveUri(assetMeta: Readonly<IAssetMeta>): string
}

export class AssetService {
  protected readonly locationMap: Map<string, IAssetMeta> = new Map()
  protected readonly middlewares: IAssetMiddleware[] = []
  protected readonly initAsset: (location: string) => Promise<IAsset>
  protected readonly saveAsset: (asset: Readonly<IAsset>) => Promise<void> | void
  protected readonly identifyLocation: (location: string) => string
  protected readonly resolveLocation: (...locationPieces: string[]) => string
  protected readonly resolveUri: (assetMeta: Readonly<IAssetMeta>) => string

  constructor(props: IAssetServiceProps) {
    const { initAsset, saveAsset, identifyLocation, resolveLocation, resolveUri } = props
    this.initAsset = initAsset
    this.saveAsset = saveAsset
    this.identifyLocation = identifyLocation
    this.resolveLocation = resolveLocation
    this.resolveUri = resolveUri
  }

  public use(middleware: IAssetMiddleware): void {
    this.middlewares.push(middleware)
  }

  public invalidate(locations: string): void {
    const { locationMap, identifyLocation } = this
    for (const location of locations) {
      const key = identifyLocation(location)
      locationMap.delete(key)
    }
  }

  public async process(location: string): Promise<void> {
    await this.resolveAsset(location)
  }

  protected async resolveAsset(location: string): Promise<IAssetMeta> {
    const locationId = this.identifyLocation(location)
    const meta = this.locationMap.get(locationId)
    if (meta !== undefined) return { ...meta }

    const { initAsset, saveAsset, resolveLocation, resolveUri } = this
    const asset: IAsset = await initAsset(location)
    this.locationMap.set(locationId, asset.meta)

    const ctx: IAssetMiddlewareContext = {
      assetMeta: { ...asset.meta },
      resolveUri,
      resolveAssetMeta: relativeLocation =>
        this.resolveAsset(resolveLocation(location, relativeLocation)),
    }
    const reducer = this.middlewares.reduceRight<IAssetMiddlewareNext>(
      (next, middleware) => (entity: IAssetEntity) => middleware(entity, ctx, next),
      entity => entity,
    )

    const entity: IAssetEntity = await reducer(asset.entity)
    await saveAsset({ meta: asset.meta, entity })
    return asset.meta
  }
}
