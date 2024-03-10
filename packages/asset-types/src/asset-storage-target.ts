import type { IUnsubscribable } from '@guanghechen/subscriber'
import type { IFileData } from './asset-file'
import type { ITargetItem, ITargetItemWithoutData } from './asset-file-target'

export interface IAssetTargetStorageMonitor {
  onFileWritten(item: ITargetItem): void
  onFileRemoved(item: ITargetItem): void
}

export type IParametersOfOnFileWritten = Parameters<IAssetTargetStorageMonitor['onFileWritten']>
export type IParametersOfOnFileRemoved = Parameters<IAssetTargetStorageMonitor['onFileRemoved']>

export interface IAssetTargetDataStorage {
  load(uri: string, fileItem: ITargetItemWithoutData): Promise<IFileData | undefined>
  remove(uri: string): Promise<void>
  save(uri: string, item: ITargetItem): Promise<void>
}

export interface IAssetTargetStorage {
  readonly destroyed: boolean
  destroy(): Promise<void>
  monitor(monitor: Partial<IAssetTargetStorageMonitor>): IUnsubscribable
  removeFile(uri: string): Promise<void>
  resolveFile(uri: string): Promise<ITargetItem | undefined>
  resolveUriFromTargetItem(item: ITargetItem): string
  writeFile(item: ITargetItem): Promise<void>
}
