import type { IAssetTaskData } from '@guanghechen/asset-types'
import type { IPipeline, IScheduler } from '@guanghechen/scheduler'
import type { ITask } from '@guanghechen/task'

export type IAssetTaskPipeline = IPipeline<IAssetTaskData, IAssetTaskData>
export type IAssetTaskScheduler = IScheduler<IAssetTaskData, IAssetTaskData>
