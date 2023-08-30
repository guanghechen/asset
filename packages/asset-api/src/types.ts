import type { IAssetTaskData } from '@guanghechen/asset-types'
import type { IPipeline, IScheduler, ITask } from '@guanghechen/types'

export type IAssetTaskPipeline = IPipeline<IAssetTaskData, ITask>
export type IAssetTaskScheduler = IScheduler<IAssetTaskData>
