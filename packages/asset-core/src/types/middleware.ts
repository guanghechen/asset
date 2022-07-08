import type { IAsset, IAssetEntity } from './asset'

export interface IProcessAssetContext {
  asset: IAsset
  loadContent(): Promise<Uint8Array>
  resolveSlug(slug: string | undefined): string
}

export interface IProcessEntityContext {
  asset: Readonly<IAsset>
  loadContent(): Promise<Buffer>
  resolveAsset(relativeLocation: string): Readonly<IAsset | undefined>
  resolveUri(asset: Readonly<IAsset>): string
}

export interface IProcessAssetNext {
  (ctx: IProcessAssetContext): Promise<IAsset> | IAsset
}

export interface IProcessEntityNext {
  (ctx: IProcessEntityContext): Promise<IAssetEntity> | IAssetEntity
}

export interface IAssetMiddleware<D = unknown> {
  processAsset(ctx: IProcessAssetContext, next: IProcessAssetNext): Promise<IAsset> | IAsset

  processEntity(
    ctx: IProcessEntityContext,
    next: IProcessEntityNext,
  ): Promise<IAssetEntity<D>> | IAssetEntity<D>
}
