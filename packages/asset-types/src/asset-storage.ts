import type { IAssetPathResolver } from './asset-path-resolver'

export type IBinaryLike = Buffer

export interface IAssetCollectOptions {
  cwd?: string // filepath under the storage rootDir
  absolute?: boolean
}

export interface IAssetSaveOptions {
  prettier: boolean
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

  /**
   *
   * @param patterns
   * @param options
   */
  collectAssetLocations(patterns: string[], options: IAssetCollectOptions): Promise<string[]>

  /**
   *
   * @param filepath
   */
  readFile(filepath: string): Promise<IBinaryLike>

  /**
   *
   * @param filepath
   */
  statFile(filepath: string): Promise<IAssetStat>

  /**
   *
   * @param patterns
   * @param options
   */
  watch(patterns: string[], options: IAssetWatchOptions): this
}

export interface IAssetTargetStorage extends IAssetPathResolver {
  /**
   *
   */
  clear(): Promise<void>

  /**
   *
   * @param filepath
   * @param isDir
   */
  mkdirsIfNotExists(filepath: string, isDir: boolean): Promise<void>

  /**
   *
   * @param filepath
   * @param content
   * @param utf8
   */
  writeFile(filepath: string, content: string | IBinaryLike, utf8?: BufferEncoding): Promise<void>
}
