import type { IAssetPathResolver } from './asset-path-resolver'

export type IBinaryLike = Buffer

export interface IAssetCollectOptions {
  cwd?: string // filepath under the storage rootDir
  absolute?: boolean
}

export interface IAssetWatchOptions {
  onAdd(filepath: string): void
  onChange(filepath: string): void
  onUnlink(filepath: string): void
}

export interface IAssetStat {
  birthtime: Date
  mtime: Date
}

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

  readTextFile(filepath: string, encoding: BufferEncoding): Promise<string>

  readJsonFile(filepath: string): Promise<unknown>

  readBinaryFile(filepath: string): Promise<IBinaryLike>

  statFile(filepath: string): Promise<IAssetStat>

  watch(patterns: string[], options: IAssetWatchOptions): this
}

export interface IAssetTargetStorage extends IAssetPathResolver {
  clear(): Promise<void>

  mkdirsIfNotExists(filepath: string, isDir: boolean): Promise<void>

  writeBinaryFile(filepath: string, content: IBinaryLike): Promise<void>

  writeTextFile(filepath: string, content: string, encoding: BufferEncoding): Promise<void>

  writeJsonFile(filepath: string, content: unknown): Promise<void>
}
