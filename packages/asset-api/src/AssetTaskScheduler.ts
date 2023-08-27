import type { IAssetResolver, IAssetResolverApi, IAssetTaskData } from '@guanghechen/asset-types'
import type { IReporter } from '@guanghechen/scheduler'
import { Scheduler } from '@guanghechen/scheduler'
import type { ITask } from '@guanghechen/task'
import { AssetTaskPipeline } from './AssetTaskPipeline'
import type { IAssetTaskScheduler } from './types'

type D = IAssetTaskData
type T = ITask

interface IProps {
  api: IAssetResolverApi
  resolver: IAssetResolver
  reporter: IReporter | undefined
  delayAfterContentChanged: number
}

export class AssetTaskScheduler extends Scheduler<D, T> implements IAssetTaskScheduler {
  constructor(props: IProps) {
    const { api, resolver, reporter, delayAfterContentChanged } = props
    const pipeline = new AssetTaskPipeline({ api, resolver, delayAfterContentChanged })
    super({ name: 'AssetTaskScheduler', reporter, pipeline })
  }

  public override finish(): Promise<void> {
    this._pipeline.close()
    return super.finish()
  }
}
