import type { IAssetEntity, IAssetMeta } from './asset'

export interface IAssetMiddlewareContext {
  assetMeta: Readonly<IAssetMeta>
  resolveUri(assetMeta: Readonly<IAssetMeta>): string
  resolveAssetMeta(relativeLocation: string): Promise<Readonly<IAssetMeta>> | Readonly<IAssetMeta>
}

export interface IAssetMiddlewareNext {
  (entity: IAssetEntity): Promise<IAssetEntity> | IAssetEntity
}

export interface IAssetMiddleware<D = unknown> {
  (entity: IAssetEntity, ctx: IAssetMiddlewareContext, next: IAssetMiddlewareNext):
    | Promise<IAssetEntity<D>>
    | IAssetEntity
}
