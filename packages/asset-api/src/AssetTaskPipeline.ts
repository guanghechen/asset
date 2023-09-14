import { AssetChangeEventEnum } from '@guanghechen/asset-types'
import type { IAssetTaskApi, IAssetTaskData } from '@guanghechen/asset-types'
import { Pipeline } from '@guanghechen/pipeline'
import type { ITask } from '@guanghechen/types'
import { AssetTask } from './AssetTask'
import type { IAssetTaskPipeline } from './types'

type D = IAssetTaskData
type T = ITask

interface IProps {
  api: IAssetTaskApi
}

export class AssetTaskPipeline extends Pipeline<D, T> implements IAssetTaskPipeline {
  protected readonly _api: IAssetTaskApi

  constructor(props: IProps) {
    super()
    this._api = props.api
  }

  public override async push(material: D): Promise<void> {
    const data: D = {
      type: material.type,
      alive: material.alive,
      srcPath: material.srcPath,
    }
    await super.push(data)
  }

  protected override async cook(material: D, others: D[]): Promise<T | undefined> {
    if (!material.alive) return undefined

    const srcPath: string = material.srcPath
    switch (material.type) {
      case AssetChangeEventEnum.CREATED:
      case AssetChangeEventEnum.MODIFIED: {
        const ir: number = others.findIndex(
          data => data.type === AssetChangeEventEnum.REMOVED && data.srcPath === srcPath,
        )
        if (ir >= 0) {
          for (let k = 0; k <= ir; ++k) {
            const data = others[k]
            if (data.srcPath === srcPath) data.alive = false
          }
          return undefined
        }

        for (let k = 0; k < others.length; ++k) {
          const data = others[k]
          if (data.srcPath === srcPath) data.alive = false
        }
        break
      }
      case AssetChangeEventEnum.REMOVED: {
        if (others.some(data => data.srcPath === srcPath)) return undefined
        break
      }
      default:
        throw new TypeError(`Unknown asset change event type: ${material.type}`)
    }
    return new AssetTask({ api: this._api, data: material })
  }
}
