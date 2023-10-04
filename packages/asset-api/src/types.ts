import type { IAssetTaskData } from '@guanghechen/asset-types'
import type { IPipeline } from '@guanghechen/pipeline'
import type { IScheduler } from '@guanghechen/scheduler'
import type { ITask } from '@guanghechen/task'

export type IAssetTaskPipeline = IPipeline<IAssetTaskData, ITask>
export type IAssetTaskScheduler = IScheduler<IAssetTaskData>
