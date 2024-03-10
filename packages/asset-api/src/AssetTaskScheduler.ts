import type { IAssetTaskData } from '@guanghechen/asset-types'
import type { IReporter } from '@guanghechen/reporter.types'
import { Pipeline, Scheduler } from '@guanghechen/scheduler'
import { TaskStrategyEnum } from '@guanghechen/task'
import { AssetDataCooker } from './AssetDataCooker'
import type { IAssetTaskPipeline, IAssetTaskScheduler } from './types'

type D = IAssetTaskData
type T = IAssetTaskData

export class AssetTaskScheduler extends Scheduler<D, T> implements IAssetTaskScheduler {
  constructor(reporter: IReporter) {
    const pipeline: IAssetTaskPipeline = new Pipeline<D, T>('asset-pipeline')
      //
      .use(new AssetDataCooker('asset-cooker'))

    super({
      name: 'asset-scheduler',
      pipeline,
      strategy: TaskStrategyEnum.CONTINUE_ON_ERROR,
      reporter,
    })
  }

  public override async complete(): Promise<void> {
    await this._pipeline.close()
    await super.complete()
  }
}
