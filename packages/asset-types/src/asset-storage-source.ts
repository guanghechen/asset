import type { IAssetStat, IBinaryFileData } from './asset-file'
import type { IRawSourceItem, ISourceItem } from './asset-file-source'
import type { IAssetPathResolver } from './asset-path-resolver'
import type { IAssetWatcher } from './common'

export interface IAssetCollectOptions {
  readonly cwd: string // filepath under the storage rootDir
}

export type IAssetWatchShouldIgnore = (
  absoluteSrcPath: string,
  pathResolver: IAssetPathResolver,
) => boolean

export type IAssetFileChangedCallback = (
  absoluteSrcPath: string,
  pathResolver: IAssetPathResolver,
) => void

export interface IAssetWatchOptions {
  readonly cwd: string // filepath under the storage rootDir
  onAdd?: IAssetFileChangedCallback
  onChange?: IAssetFileChangedCallback
  onRemove?: IAssetFileChangedCallback
  shouldIgnore?: IAssetWatchShouldIgnore
}

export interface IMemoAssetSourceDataStorage {
  has(absoluteSrcPath: string): boolean
  get(absoluteSrcPath: string): ISourceItem | undefined
  set(absoluteSrcPath: string, item: ISourceItem): void
  delete(absoluteSrcPath: string): void
  values(): Iterable<ISourceItem>
  loadOnDemand(absoluteSrcPath: string): Promise<IRawSourceItem | undefined>
}

export interface IAssetSourceStorage {
  assertExistedFile(absoluteSrcPath: string): Promise<void | never>
  detectEncoding(absoluteSrcPath: string): Promise<BufferEncoding | undefined>
  readFile(absoluteSrcPath: string): Promise<IBinaryFileData>
  removeFile(absoluteSrcPath: string): Promise<void>
  statFile(absoluteSrcPath: string): Promise<IAssetStat>
  updateFile(absoluteSrcPath: string, data: IBinaryFileData): Promise<void>
  watch(patterns: ReadonlyArray<string>, options: IAssetWatchOptions): IAssetWatcher
  collect(patterns: ReadonlyArray<string>, options: IAssetCollectOptions): Promise<string[]>
}
