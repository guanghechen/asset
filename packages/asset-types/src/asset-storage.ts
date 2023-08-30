import type { IMonitorUnsubscribe } from '@guanghechen/monitor'
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
  onUnlink(filepath: string): void
}

export interface IAssetTargetStorageMonitor {
  onWrittenBinaryFile(item: IBinaryFileItem): void

  onWrittenTextFile(item: ITextFileItem): void

  onWrittenJsonFile(item: IJsonFileItem): void

  onWrittenFile(item: IFileItem): void
}

export type IParametersOfOnWrittenBinaryFile = Parameters<
  IAssetTargetStorageMonitor['onWrittenBinaryFile']
>
export type IParametersOfOnWrittenTextFile = Parameters<
  IAssetTargetStorageMonitor['onWrittenTextFile']
>
export type IParametersOfOnWrittenJsonFile = Parameters<
  IAssetTargetStorageMonitor['onWrittenJsonFile']
>
export type IParametersOfOnWrittenFile = Parameters<IAssetTargetStorageMonitor['onWrittenFile']>

export interface IAssetSourceStorage extends IAssetPathResolver {
  /**
   * Ensure the location is existed.
   * @param location absolute path or relative path to the {rootDir}
   */
  assertExistedLocation(location: string): Promise<void | never>

  /**
   * Ensure the location is existed and it pointer to a file.
   * @param location absolute path or relative path to the {rootDir}
   */
  assertExistedFile(location: string): Promise<void | never>

  collectAssetLocations(patterns: string[], options: IAssetCollectOptions): Promise<string[]>

  readBinaryFile(filepath: string): Promise<IBinaryLike>

  readTextFile(filepath: string, encoding: BufferEncoding): Promise<string>

  readJsonFile(filepath: string): Promise<unknown>

  statFile(filepath: string): Promise<IAssetStat>

  watch(patterns: string[], options: IAssetWatchOptions): IAssetWatcher
}

export interface IAssetTargetStorage extends IAssetPathResolver {
  readonly destroyed: boolean

  destroy(): Promise<void>

  monitor(monitor: Partial<IAssetTargetStorageMonitor>): IMonitorUnsubscribe

  mkdirsIfNotExists(filepath: string, isDir: boolean): Promise<void>

  writeBinaryFile(filepath: string, content: IBinaryLike): Promise<void>

  writeTextFile(filepath: string, content: string, encoding: BufferEncoding): Promise<void>

  writeJsonFile(filepath: string, content: unknown): Promise<void>
}
