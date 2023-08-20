import type { IConsumerPipeline, IProviderPipeline, ITask } from '@guanghechen/scheduler'

export enum AssetChangeEvent {
  CREATED = 'created',
  MODIFIED = 'modified',
  REMOVED = 'removed',
}

export interface IAssetChangeTaskData {
  type: AssetChangeEvent
  payload: {
    locations: string[]
  }
}

export type IAssetChangeTaskPipeline = IConsumerPipeline<ITask> &
  IProviderPipeline<IAssetChangeTaskData>
