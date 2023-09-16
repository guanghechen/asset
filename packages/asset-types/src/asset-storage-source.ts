import type { IAssetStat, IBinaryFileData } from './asset-file'
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

export interface IAssetSourceDataStorage {
  readonly pathResolver: IAssetPathResolver
}

export interface IAssetSourceStorage {
  readonly pathResolver: IAssetPathResolver

  assertExistedFile(srcPath: string): Promise<void | never>

  collectAssetSrcPaths(
    patterns: ReadonlyArray<string>,
    options: IAssetCollectOptions,
  ): Promise<string[]>

  readBinaryFile(filepath: string): Promise<IBinaryFileData>

  readTextFile(filepath: string, encoding: BufferEncoding): Promise<string>

  readJsonFile(filepath: string): Promise<unknown>

  statFile(filepath: string): Promise<IAssetStat>

  watch(patterns: ReadonlyArray<string>, options: IAssetWatchOptions): IAssetWatcher
}
