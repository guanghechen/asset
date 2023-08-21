import type { IAssetChangeTaskData } from '@guanghechen/asset-types'
import type { IConsumerPipeline, IProviderPipeline, ITask } from '@guanghechen/scheduler'

export type IAssetChangeTaskPipeline = IConsumerPipeline<ITask> &
  IProviderPipeline<IAssetChangeTaskData>
