import type { IAssetResolver, IAssetResolverApi, IAssetTaskData } from '@guanghechen/asset-types'
import type { IPipeline, IScheduler, ITask } from '@guanghechen/types'

export type IAssetTaskPipeline = IPipeline<IAssetTaskData, ITask>
export type IAssetTaskScheduler = IScheduler<IAssetTaskData>

export interface IAssetTaskContext {
  api: IAssetResolverApi
  resolver: IAssetResolver
  delayAfterContentChanged: number
}
