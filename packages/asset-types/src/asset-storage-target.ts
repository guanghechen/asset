import type { IMonitorUnsubscribe } from '@guanghechen/types'
import type { IAssetFileItem, IFileData, IFileItem, IRawFileItem } from './asset-file'
import type { IAssetPathResolver } from './asset-path-resolver'

export interface IAssetTargetStorageMonitor {
  onFileWritten(item: IFileItem): void
  onFileRemoved(item: IFileItem): void
}

export type IParametersOfOnFileWritten = Parameters<IAssetTargetStorageMonitor['onFileWritten']>
export type IParametersOfOnFileRemoved = Parameters<IAssetTargetStorageMonitor['onFileRemoved']>

export interface IAssetTargetDataStorage {
  readonly pathResolver: IAssetPathResolver
  save(rawItem: IRawFileItem): Promise<void>
  remove(uri: string): Promise<void>
  load(uri: string, assetItem: IAssetFileItem): Promise<IFileData | undefined>
}

export interface IAssetTargetStorage {
  readonly destroyed: boolean
  destroy(): Promise<void>
  monitor(monitor: Partial<IAssetTargetStorageMonitor>): IMonitorUnsubscribe
  removeFile(uri: string): Promise<void>
  resolveFile(uri: string): Promise<IFileItem | undefined>
  writeFile(item: IRawFileItem): Promise<void>
}
