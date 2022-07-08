import type { IAsset, IAssetEntity } from './asset'

export interface IBuffer extends Uint8Array {
  toString(encoding?: BufferEncoding, start?: number, end?: number): string
}

export interface IProcessAssetContext {
  asset: IAsset
  loadContent(): Promise<IBuffer>
  resolveSlug(slug: string | undefined): string
}

export interface IProcessEntityContext {
  asset: Readonly<IAsset>
  loadContent(): Promise<IBuffer>
  resolveAsset(relativeLocation: string): Readonly<IAsset | undefined>
  resolveUri(asset: Readonly<IAsset>): string
}

export interface IProcessAssetNext {
  (ctx: IProcessAssetContext): Promise<IAsset> | IAsset
}

export interface IProcessEntityNext {
  (ctx: IProcessEntityContext): Promise<IAssetEntity> | IAssetEntity
}

export interface IAssetMiddleware {
  processAsset(ctx: IProcessAssetContext, next: IProcessAssetNext): Promise<IAsset> | IAsset

  processEntity(
    ctx: IProcessEntityContext,
    next: IProcessEntityNext,
  ): Promise<IAssetEntity> | IAssetEntity
}
