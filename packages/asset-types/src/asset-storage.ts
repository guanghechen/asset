import type { IMonitorUnsubscribe } from '@guanghechen/types'
import type {
  IAssetStat,
  IBinaryFileItem,
  IBinaryLike,
  IFileItem,
  IJsonFileItem,
  ITextFileItem,
} from './asset-file'
import type { IAssetPathResolver } from './asset-path-resolver'
import type { IAssetWatcher } from './common'

export interface IAssetCollectOptions {
  cwd?: string // filepath under the storage rootDir
  absolute?: boolean
}

export interface IAssetWatchOptions {
  onAdd(filepath: string): void
  onChange(filepath: string): void
  onRemove(filepath: string): void
}

export interface IAssetTargetStorageMonitor {
  onBinaryFileWritten(item: IBinaryFileItem): void

  onTextFileWritten(item: ITextFileItem): void

  onJsonFileWritten(item: IJsonFileItem): void

  onFileWritten(item: IFileItem): void

  onFileRemoved(filepath: string): void
}

export type IParametersOfOnBinaryFileWritten = Parameters<
  IAssetTargetStorageMonitor['onBinaryFileWritten']
>
export type IParametersOfOnTextFileWritten = Parameters<
  IAssetTargetStorageMonitor['onTextFileWritten']
>
export type IParametersOfOnJsonFileWritten = Parameters<
  IAssetTargetStorageMonitor['onJsonFileWritten']
>
export type IParametersOfOnFileWritten = Parameters<IAssetTargetStorageMonitor['onFileWritten']>
export type IParametersOfOnFileRemoved = Parameters<IAssetTargetStorageMonitor['onFileRemoved']>

export interface IAssetSourceStorage {
  readonly pathResolver: IAssetPathResolver

  assertExistedFile(srcPath: string): Promise<void | never>

  collectAssetSrcPaths(patterns: string[], options: IAssetCollectOptions): Promise<string[]>

  readBinaryFile(filepath: string): Promise<IBinaryLike>

  readTextFile(filepath: string, encoding: BufferEncoding): Promise<string>

  readJsonFile(filepath: string): Promise<unknown>

  statFile(filepath: string): Promise<IAssetStat>

  watch(patterns: string[], options: IAssetWatchOptions): IAssetWatcher
}

export interface IAssetTargetStorage {
  readonly pathResolver: IAssetPathResolver
  readonly destroyed: boolean

  destroy(): Promise<void>

  locateFileByUri(uri: string): Promise<IFileItem | undefined>

  monitor(monitor: Partial<IAssetTargetStorageMonitor>): IMonitorUnsubscribe

  writeBinaryFile(uri: string, mimetype: string, content: IBinaryLike): Promise<void>

  writeTextFile(
    uri: string,
    mimetype: string,
    content: string,
    encoding: BufferEncoding,
  ): Promise<void>

  writeJsonFile(uri: string, mimetype: string, content: unknown): Promise<void>

  removeFile(uri: string): Promise<void>
}
