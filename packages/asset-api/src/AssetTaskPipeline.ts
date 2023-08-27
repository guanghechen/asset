import { AssetChangeEvent } from '@guanghechen/asset-types'
import type { IAssetResolver, IAssetResolverApi, IAssetTaskData } from '@guanghechen/asset-types'
import { Pipeline } from '@guanghechen/pipeline'
import type { ITask } from '@guanghechen/task'
import type { IAssetTaskContext } from './AssetTask'
import { AssetTask } from './AssetTask'
import type { IAssetTaskPipeline } from './types'

type D = IAssetTaskData
type T = ITask

interface IProps {
  api: IAssetResolverApi
  resolver: IAssetResolver
  delayAfterContentChanged: number
}

export class AssetTaskPipeline extends Pipeline<D, T> implements IAssetTaskPipeline {
  protected readonly _ctx: IAssetTaskContext

  constructor(props: IProps) {
    super()

    const { api, resolver, delayAfterContentChanged } = props
    this._ctx = { api, resolver, delayAfterContentChanged }
  }

  protected override cook(material: D, others: D[]): T | undefined {
    if (!material.alive) return undefined

    const location: string = material.payload.location
    switch (material.type) {
      case AssetChangeEvent.CREATED:
      case AssetChangeEvent.MODIFIED: {
        const ir: number = others.findIndex(
          data => data.type === AssetChangeEvent.REMOVED && data.payload.location === location,
        )
        if (ir >= 0) {
          for (let k = 0; k <= ir; ++k) {
            const data = others[k]
            if (data.payload.location === location) data.alive = false
          }
          return undefined
        }

        for (let k = 0; k < others.length; ++k) {
          const data = others[k]
          if (data.payload.location === location) data.alive = false
        }
        break
      }
      case AssetChangeEvent.REMOVED: {
        if (others.some(data => data.payload.location === location)) return undefined
        break
      }
      default:
        throw new TypeError(`Unknown asset change event type: ${material.type}`)
    }
    return new AssetTask({ ctx: this._ctx, data: material })
  }
}
