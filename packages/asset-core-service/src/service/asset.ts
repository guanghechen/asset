import type { IAsset, IAssetDataMap, IAssetManager, IRawAsset } from '@guanghechen/asset-core'
import invariant from '@guanghechen/invariant'
import type { IAssetEntity } from '../types/asset'
import type { IAssetMiddleware, IProcessAssetNext, IProcessEntityNext } from '../types/middleware'

export interface IAssetServiceProps {
  loadContent(location: string): Promise<Buffer>
  initAsset(location: string): Promise<IRawAsset>
  saveAsset(asset: Readonly<IAsset>, entity: Readonly<IAssetEntity>): Promise<void>
  identifyLocation(location: string): string
  resolveLocation(...locationPieces: string[]): string
  resolveSlug(slug: string | undefined): string
  resolveUri(asset: Readonly<IAsset>): string
}

export class AssetService {
  protected readonly location2AssetMap: Map<string, IAsset | null> = new Map()
  protected readonly assetManager: IAssetManager = null as any
  protected readonly middlewares: IAssetMiddleware[] = []
  protected readonly loadContent: (location: string) => Promise<Buffer>
  protected readonly initAsset: (location: string) => Promise<IRawAsset>
  protected readonly saveAsset: (
    asset: Readonly<IAsset>,
    entity: Readonly<IAssetEntity>,
  ) => Promise<void>
  protected readonly identifyLocation: (location: string) => string
  protected readonly resolveLocation: (...locationPieces: string[]) => string
  protected readonly resolveSlug: (slug: string | undefined) => string
  protected readonly resolveUri: (asset: Readonly<IAsset>) => string

  constructor(props: IAssetServiceProps) {
    const {
      loadContent,
      initAsset,
      saveAsset,
      identifyLocation,
      resolveLocation,
      resolveSlug,
      resolveUri,
    } = props

    this.loadContent = loadContent
    this.initAsset = initAsset
    this.saveAsset = saveAsset
    this.identifyLocation = identifyLocation
    this.resolveLocation = resolveLocation
    this.resolveSlug = resolveSlug
    this.resolveUri = resolveUri
  }

  public use(middleware: IAssetMiddleware): void {
    this.middlewares.push(middleware)
  }

  public dump(): IAssetDataMap {
    return this.assetManager.toJSON()
  }

  public invalidate(locations: string): void {
    const { location2AssetMap: locationMap, identifyLocation } = this
    for (const location of locations) {
      const key = identifyLocation(location)
      locationMap.delete(key)
    }
  }

  public async process(locations: string[]): Promise<void> {
    for (const location of locations) await this.processAsset(location)
    for (const location of locations) await this.processEntity(location)
  }

  protected async processAsset(location: string): Promise<void> {
    const locationId = this.identifyLocation(location)
    if (this.location2AssetMap.has(locationId)) return

    const { initAsset, loadContent, resolveSlug } = this
    const reducer = this.middlewares.reduceRight<IProcessAssetNext>(
      (next, middleware) => ctx => middleware.processAsset(ctx, next),
      ctx => ctx.rawAsset,
    )

    let rawContent: Promise<Buffer> | undefined
    const rawAsset = await reducer({
      rawAsset: await initAsset(location),
      loadContent: () => {
        if (rawContent === undefined) {
          rawContent = loadContent(location)
        }
        return rawContent
      },
      resolveSlug,
    })

    const asset = this.assetManager.insert(rawAsset)
    this.location2AssetMap.set(locationId, asset ?? null)
  }

  protected async processEntity(location: string): Promise<void> {
    const {
      location2AssetMap,
      loadContent,
      identifyLocation,
      resolveLocation,
      resolveUri,
      saveAsset,
    } = this

    const asset = location2AssetMap.get(identifyLocation(location))
    invariant(asset != null, `[resolveEntity] Cannot resolve asset by (${location})`)

    const reducer = this.middlewares.reduceRight<IProcessEntityNext>(
      (next, middleware) => ctx => middleware.processEntity(ctx, next),
      () => ({ data: undefined }),
    )

    let rawContent: Promise<Buffer> | undefined
    const entity: IAssetEntity = await reducer({
      asset,
      loadContent: () => {
        if (rawContent === undefined) {
          rawContent = loadContent(location)
        }
        return rawContent
      },
      resolveAsset: (relativeLocation: string): Readonly<IAsset | undefined> => {
        const locationId = identifyLocation(resolveLocation(location, relativeLocation))
        const asset0 = location2AssetMap.get(locationId)
        return asset0 ? { ...asset0 } : undefined
      },
      resolveUri,
    })

    if (entity.data !== undefined) await saveAsset(asset, entity)
  }
}
