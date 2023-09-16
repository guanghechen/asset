import type { IAssetStat } from './asset-file'
import type { IRawSourceItem, ISourceItem } from './asset-file-source'
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
  readFile(rawItem: IRawSourceItem): Promise<ISourceItem>
  removeFile(filepath: string): Promise<void>
  statFile(filepath: string): Promise<IAssetStat>
  updateFile(item: ISourceItem): Promise<void>
  watch(patterns: ReadonlyArray<string>, options: IAssetWatchOptions): IAssetWatcher
}
