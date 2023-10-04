import type { IAssetTaskApi, IAssetTaskData } from '@guanghechen/asset-types'
import { ErrorLevelEnum } from '@guanghechen/error.types'
import type { IReporter } from '@guanghechen/reporter.types'
import { Scheduler } from '@guanghechen/scheduler'
import { TaskStatusEnum } from '@guanghechen/task'
import type { ITask } from '@guanghechen/task'
import { AssetTaskPipeline } from './AssetTaskPipeline'
import type { IAssetTaskScheduler } from './types'

type D = IAssetTaskData
type T = ITask

export class AssetTaskScheduler extends Scheduler<D, T> implements IAssetTaskScheduler {
  constructor(api: IAssetTaskApi, reporter: IReporter) {
    const pipeline = new AssetTaskPipeline(api)
    super({ name: 'AssetTaskScheduler', reporter, pipeline })

    this.monitor({
      onAddError: (type: string, error: unknown, level: ErrorLevelEnum | undefined): void => {
        switch (level) {
          case ErrorLevelEnum.FATAL:
            reporter.fatal('[AssetTaskScheduler] {}', type, error)
            break
          case ErrorLevelEnum.ERROR:
            reporter.error('[AssetTaskScheduler] {}', type, error)
            break
          case ErrorLevelEnum.WARN:
            reporter.warn('[AssetTaskScheduler] {}', type, error)
            break
          default:
            reporter.error('[AssetTaskScheduler] {} unexpected level {}.', type, level, error)
            break
        }
      },
    })
  }

  public override async finish(): Promise<void> {
    if (this.status === TaskStatusEnum.PENDING || this.alive) {
      await this._pipeline.close()
      await super.finish()
    }
  }
}
