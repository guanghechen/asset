import type { IAssetStat, IBinaryFileData } from './asset-file'
import type { ISourceItem } from './asset-file-source'
import type { IAssetPathResolver } from './asset-path-resolver'
import type { IAssetWatcher } from './common'

export interface IAssetCollectOptions {
  cwd?: string // filepath under the storage rootDir
  absolute?: boolean
}

export type IAssetWatchShouldIgnore = (
  filepath: string,
  pathResolver: IAssetPathResolver,
) => boolean

export type IAssetFileChangedCallback = (filepath: string, pathResolver: IAssetPathResolver) => void

export interface IAssetWatchOptions {
  onAdd?: IAssetFileChangedCallback
  onChange?: IAssetFileChangedCallback
  onRemove?: IAssetFileChangedCallback
  shouldIgnore?: IAssetWatchShouldIgnore
}

export interface IAssetSourceStorage {
  readonly pathResolver: IAssetPathResolver
  assertExistedFile(srcPath: string): Promise<void | never>
  collect(patterns: ReadonlyArray<string>, options: IAssetCollectOptions): Promise<string[]>
  readFile(srcPath: string): Promise<ISourceItem>
  removeFile(srcPath: string): Promise<void>
  statFile(srcPath: string): Promise<IAssetStat>
  updateFile(srcPath: string, data: IBinaryFileData): Promise<void>
  watch(patterns: ReadonlyArray<string>, options: IAssetWatchOptions): IAssetWatcher
}