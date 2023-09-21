import type { IMonitorUnsubscribe } from '@guanghechen/types'
import type { IFileData } from './asset-file'
import type { IRawTargetItem, ITargetItem, ITargetItemWithoutData } from './asset-file-target'
import type { IAssetPathResolver } from './asset-path-resolver'

export interface IAssetTargetStorageMonitor {
  onFileWritten(item: ITargetItem): void
  onFileRemoved(item: ITargetItem): void
}

export type IParametersOfOnFileWritten = Parameters<IAssetTargetStorageMonitor['onFileWritten']>
export type IParametersOfOnFileRemoved = Parameters<IAssetTargetStorageMonitor['onFileRemoved']>

export interface IAssetTargetDataStorage {
  readonly pathResolver: IAssetPathResolver
  load(uri: string, fileItem: ITargetItemWithoutData): Promise<IFileData | undefined>
  remove(uri: string): Promise<void>
  save(rawItem: IRawTargetItem): Promise<void>
}

export interface IAssetTargetStorage {
  readonly destroyed: boolean
  destroy(): Promise<void>
  monitor(monitor: Partial<IAssetTargetStorageMonitor>): IMonitorUnsubscribe
  removeFile(uri: string): Promise<void>
  resolveFile(uri: string): Promise<ITargetItem | undefined>
  writeFile(rawItem: IRawTargetItem): Promise<void>
}
