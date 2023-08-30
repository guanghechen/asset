import type { IAssetResolver, IAssetResolverApi, IAssetTaskData } from '@guanghechen/asset-types'
import { ErrorLevelEnum } from '@guanghechen/constant'
import { Scheduler } from '@guanghechen/scheduler'
import type { IReporter, ITask } from '@guanghechen/types'
import { AssetTaskPipeline } from './AssetTaskPipeline'
import type { IAssetTaskScheduler } from './types'

type D = IAssetTaskData
type T = ITask

interface IProps {
  api: IAssetResolverApi
  resolver: IAssetResolver
  reporter: IReporter
  delayAfterContentChanged: number
}

export class AssetTaskScheduler extends Scheduler<D, T> implements IAssetTaskScheduler {
  constructor(props: IProps) {
    const { api, resolver, reporter, delayAfterContentChanged } = props
    const pipeline = new AssetTaskPipeline({ api, resolver, delayAfterContentChanged })
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
            reporter.error('[AssetTaskScheduler] type unexpected level: ', type, level, error)
            break
        }
      },
    })
  }

  public override finish(): Promise<void> {
    this._pipeline.close()
    return super.finish()
  }
}
