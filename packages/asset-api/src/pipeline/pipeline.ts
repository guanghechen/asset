import type { IAssetResolver, IAssetResolverApi } from '@guanghechen/asset-types'
import type { ITask } from '@guanghechen/scheduler'
import { BaseCommonPipeline, isPipelineTerminated } from '@guanghechen/scheduler'
import { AssetChangeTask } from './task'
import type { IAssetChangeTaskData, IAssetChangeTaskPipeline } from './types'
import { AssetChangeEvent } from './types'

export interface IAssetChangePipelineProps {
  api: IAssetResolverApi
  resolver: IAssetResolver
  delayAfterContentChanged: number
}

export class AssetChangePipeline extends BaseCommonPipeline implements IAssetChangeTaskPipeline {
  protected readonly _api: IAssetResolverApi
  protected readonly _resolver: IAssetResolver
  protected readonly _delayAfterContentChanged: number
  protected _taskDataList: IAssetChangeTaskData[]

  constructor(props: IAssetChangePipelineProps) {
    super()
    this._api = props.api
    this._resolver = props.resolver
    this._delayAfterContentChanged = props.delayAfterContentChanged
    this._taskDataList = []
  }

  public override get size(): number {
    return this._taskDataList.length
  }

  public pull(): ITask | undefined {
    const data = this._taskDataList.shift()
    if (data) {
      const task = new AssetChangeTask({
        api: this._api,
        resolver: this._resolver,
        delayAfterContentChanged: this._delayAfterContentChanged,
        data,
      })
      this._batchMonitor.onPulled()
      return task
    }
  }

  public push(...elements: IAssetChangeTaskData[]): void {
    if (isPipelineTerminated(this._status)) return
    for (const nextData of elements) this._squashPush(nextData)
    this._batchMonitor.onPushed()
  }

  protected _squashPush(nextData: IAssetChangeTaskData): void {
    let i: number = this._taskDataList.length - 1
    switch (nextData.type) {
      case AssetChangeEvent.CREATED: {
        for (; i >= 0; --i) {
          const data = this._taskDataList[i]
          if (data.type === AssetChangeEvent.CREATED) break
          if (data.type === AssetChangeEvent.REMOVED) break
        }
        break
      }
      case AssetChangeEvent.MODIFIED: {
        for (; i >= 0; --i) {
          const data = this._taskDataList[i]
          if (data.type === AssetChangeEvent.MODIFIED) break
          if (data.type === AssetChangeEvent.REMOVED) break
        }
        break
      }
      case AssetChangeEvent.REMOVED:
        break
    }

    if (i >= 0) {
      const data = this._taskDataList[i]
      const locations: string[] = data.payload.locations
      const nextLocations: string[] = nextData.payload.locations

      if (data.type === nextData.type) {
        this._taskDataList[i] = {
          type: data.type,
          payload: {
            locations: [
              ...locations,
              ...nextLocations.filter(location => !locations.includes(location)),
            ],
          },
        }
        return
      }
    }

    this._taskDataList.push(nextData)
  }
}
