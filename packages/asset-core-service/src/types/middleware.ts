import type { IAssetEntity } from './asset'

export interface IBuffer extends Uint8Array {
  toString(encoding?: BufferEncoding, start?: number, end?: number): string
}

export type IMiddlewareProcessEmbryo = Omit<IAssetEntity, 'hash' | 'src' | 'uri'>
export type IMiddlewarePostProcessEmbryo = Pick<IAssetEntity, 'type' | 'data'>

export interface IMiddlewareProcessContext {
  embryo: IMiddlewareProcessEmbryo
  readonly resolveSlug: (slug: string | undefined) => string
}

export interface IMiddlewarePostProcessContext {
  embryo: IMiddlewarePostProcessEmbryo
  readonly resolveAsset: (relativeLocation: string) => Readonly<IAssetEntity | null>
}

export interface IMiddlewareProcessNext {
  (ctx: IMiddlewareProcessContext): IMiddlewareProcessEmbryo | Promise<IMiddlewareProcessEmbryo>
}

export interface IMiddlewarePostProcessNext {
  (ctx: IMiddlewarePostProcessContext):
    | IMiddlewarePostProcessEmbryo
    | Promise<IMiddlewarePostProcessEmbryo>
}

export interface IAssetProcessingMiddleware {
  displayName: string

  process(
    ctx: IMiddlewareProcessContext,
    next: IMiddlewareProcessNext,
  ): IMiddlewareProcessEmbryo | Promise<IMiddlewareProcessEmbryo>

  postProcess(
    ctx: IMiddlewarePostProcessContext,
    next: IMiddlewarePostProcessNext,
  ): IMiddlewarePostProcessEmbryo | Promise<IMiddlewarePostProcessEmbryo>
}
