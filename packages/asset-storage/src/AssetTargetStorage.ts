import type {
  IAssetTargetStorage,
  IAssetTargetStorageMonitor,
  IParametersOfOnBinaryFileWritten,
  IParametersOfOnFileRemoved,
  IParametersOfOnFileWritten,
  IParametersOfOnJsonFileWritten,
  IParametersOfOnTextFileWritten,
} from '@guanghechen/asset-types'
import { Monitor } from '@guanghechen/monitor'
import type { IMonitor, IMonitorUnsubscribe } from '@guanghechen/monitor'
import { noop } from '@guanghechen/shared'
import { AssetPathResolver } from './AssetPathResolver'

export interface IAssetTargetStorageProps {
  rootDir: string
  caseSensitive: boolean
}

export abstract class AssetTargetStorage extends AssetPathResolver implements IAssetTargetStorage {
  private _destroyed: boolean
  protected readonly _monitors: {
    onBinaryFileWritten: IMonitor<IParametersOfOnBinaryFileWritten>
    onTextFileWritten: IMonitor<IParametersOfOnTextFileWritten>
    onJsonFileWritten: IMonitor<IParametersOfOnJsonFileWritten>
    onFileWritten: IMonitor<IParametersOfOnFileWritten>
    onFileRemoved: IMonitor<IParametersOfOnFileRemoved>
  }

  constructor(props: IAssetTargetStorageProps) {
    const { rootDir, caseSensitive } = props

    super({ rootDir, caseSensitive })
    this._monitors = {
      onBinaryFileWritten: new Monitor<IParametersOfOnBinaryFileWritten>('onBinaryFileWritten'),
      onTextFileWritten: new Monitor<IParametersOfOnTextFileWritten>('onTextFileWritten'),
      onJsonFileWritten: new Monitor<IParametersOfOnJsonFileWritten>('onJsonFileWritten'),
      onFileWritten: new Monitor<IParametersOfOnFileWritten>('onFileWritten'),
      onFileRemoved: new Monitor<IParametersOfOnFileRemoved>('onFileRemoved'),
    }
    this._destroyed = false
  }

  public get destroyed(): boolean {
    return this._destroyed
  }

  public async destroy(): Promise<void> {
    if (this._destroyed) return

    this._destroyed = true
    this._monitors.onBinaryFileWritten.destroy()
    this._monitors.onTextFileWritten.destroy()
    this._monitors.onJsonFileWritten.destroy()
    this._monitors.onFileWritten.destroy()
  }

  public monitor(monitor: Partial<IAssetTargetStorageMonitor>): IMonitorUnsubscribe {
    if (this.destroyed) return noop

    const {
      onBinaryFileWritten,
      onTextFileWritten,
      onJsonFileWritten,
      onFileWritten,
      onFileRemoved,
    } = monitor

    const unsubscribeOnBinaryFileWritten =
      this._monitors.onBinaryFileWritten.subscribe(onBinaryFileWritten)
    const unsubscribeOnTextFileWritten =
      this._monitors.onTextFileWritten.subscribe(onTextFileWritten)
    const unsubscribeOnJsonFileWritten =
      this._monitors.onJsonFileWritten.subscribe(onJsonFileWritten)
    const unsubscribeOnFileWritten = this._monitors.onFileWritten.subscribe(onFileWritten)
    const unsubscribeOnFileRemoved = this._monitors.onFileRemoved.subscribe(onFileRemoved)

    return (): void => {
      unsubscribeOnBinaryFileWritten()
      unsubscribeOnTextFileWritten()
      unsubscribeOnJsonFileWritten()
      unsubscribeOnFileWritten()
      unsubscribeOnFileRemoved()
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

  public abstract removeFile(filepath: string): Promise<void>
}
