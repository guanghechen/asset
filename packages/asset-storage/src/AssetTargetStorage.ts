import type {
  IAssetTargetStorage,
  IAssetTargetStorageMonitor,
  IParametersOfOnWrittenBinaryFile,
  IParametersOfOnWrittenFile,
  IParametersOfOnWrittenJsonFile,
  IParametersOfOnWrittenTextFile,
} from '@guanghechen/asset-types'
import { Monitor } from '@guanghechen/monitor'
import type { IMonitor, IMonitorUnsubscribe } from '@guanghechen/monitor'
import { noop } from '@guanghechen/shared'
import { AssetPathResolver } from './AssetPathResolver'

export interface IAssetStorageProps {
  rootDir: string
}

export abstract class AssetTargetStorage extends AssetPathResolver implements IAssetTargetStorage {
  private _destroyed: boolean
  protected readonly _monitors: {
    onWrittenBinaryFile: IMonitor<IParametersOfOnWrittenBinaryFile>
    onWrittenTextFile: IMonitor<IParametersOfOnWrittenTextFile>
    onWrittenJsonFile: IMonitor<IParametersOfOnWrittenJsonFile>
    onWrittenFile: IMonitor<IParametersOfOnWrittenFile>
  }

  constructor(props: IAssetStorageProps) {
    const { rootDir } = props
    super({ rootDir })
    this._monitors = {
      onWrittenBinaryFile: new Monitor<IParametersOfOnWrittenBinaryFile>('onWrittenBinaryFile'),
      onWrittenTextFile: new Monitor<IParametersOfOnWrittenTextFile>('onWrittenTextFile'),
      onWrittenJsonFile: new Monitor<IParametersOfOnWrittenJsonFile>('onWrittenJsonFile'),
      onWrittenFile: new Monitor<IParametersOfOnWrittenFile>('onWrittenFile'),
    }
    this._destroyed = false
  }

  public get destroyed(): boolean {
    return this._destroyed
  }

  public async destroy(): Promise<void> {
    if (this._destroyed) return

    this._destroyed = true
    this._monitors.onWrittenBinaryFile.destroy()
    this._monitors.onWrittenTextFile.destroy()
    this._monitors.onWrittenJsonFile.destroy()
    this._monitors.onWrittenFile.destroy()
  }

  public monitor(monitor: Partial<IAssetTargetStorageMonitor>): IMonitorUnsubscribe {
    if (this.destroyed) return noop

    const { onWrittenBinaryFile, onWrittenTextFile, onWrittenJsonFile, onWrittenFile } = monitor
    const unsubscribeOnWrittenBinaryFile =
      this._monitors.onWrittenBinaryFile.subscribe(onWrittenBinaryFile)
    const unsubscribeOnWrittenTextFile =
      this._monitors.onWrittenTextFile.subscribe(onWrittenTextFile)
    const unsubscribeOnWrittenJsonFile =
      this._monitors.onWrittenJsonFile.subscribe(onWrittenJsonFile)
    const unsubscribeOnWrittenFile = this._monitors.onWrittenFile.subscribe(onWrittenFile)

    return (): void => {
      unsubscribeOnWrittenBinaryFile()
      unsubscribeOnWrittenTextFile()
      unsubscribeOnWrittenJsonFile()
      unsubscribeOnWrittenFile()
    }
  }

  public abstract mkdirsIfNotExists(filepath: string, isDir: boolean): Promise<void>

  public abstract writeBinaryFile(filepath: string, content: Buffer): Promise<void>

  public abstract writeTextFile(
    filepath: string,
    content: string,
    encoding: BufferEncoding,
  ): Promise<void>

  public abstract writeJsonFile(filepath: string, content: unknown): Promise<void>
}
