import type {
  IAssetCollectOptions,
  IAssetSourceStorage,
  IAssetStat,
  IAssetTargetStorage,
  IAssetWatchOptions,
  IBinaryLike,
} from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import chokidar from 'chokidar'
import fastGlob from 'fast-glob'
import { existsSync } from 'node:fs'
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import { FileAssetPathResolver } from './FileAssetPathResolver'

export interface IFileAssetStorageProps {
  rootDir: string
  watchOptions?: Partial<chokidar.WatchOptions>
  onWriteFile?: (
    storage: IAssetTargetStorage,
    filepath: string,
    content: string | IBinaryLike,
    encoding: BufferEncoding | undefined,
  ) => void
}

export class FileAssetStorage
  extends FileAssetPathResolver
  implements IAssetSourceStorage, IAssetTargetStorage
{
  protected readonly watchOptions: Partial<chokidar.WatchOptions>
  protected readonly onWriteFile?: (
    storage: IAssetTargetStorage,
    filepath: string,
    content: string | IBinaryLike,
    encoding: BufferEncoding | undefined,
  ) => void

  constructor(props: IFileAssetStorageProps) {
    super({ rootDir: props.rootDir })
    this.watchOptions = props.watchOptions ?? {}
    this.onWriteFile = props.onWriteFile
  }

  public async clear(): Promise<void> {
    // Do nothing
  }

  public async assertExistedLocation(location: string): Promise<void | never> {
    const absoluteLocation: string = this.resolve(location)
    invariant(
      existsSync(absoluteLocation),
      `[assertExistedLocation] Cannot find file. (${location})`,
    )
  }

  public async assertExistedFile(location: string): Promise<void | never> {
    const absoluteLocation: string = this.resolve(location)
    invariant(existsSync(absoluteLocation), `[assertExistedFile] Cannot find file. (${location})`)

    const assertion: boolean = (await stat(absoluteLocation)).isFile()
    invariant(assertion, `[assertExistedFile] Not a file'. (${location})`)
  }

  public async collectAssetLocations(
    patterns: string[],
    options: IAssetCollectOptions,
  ): Promise<string[]> {
    const cwd = options.cwd || this.rootDir
    await this.assertSafeLocation(cwd)

    const filepaths: string[] = await fastGlob(patterns, {
      cwd,
      dot: true,
      absolute: options.absolute ?? false,
      onlyDirectories: false,
      onlyFiles: true,
      throwErrorOnBrokenSymbolicLink: true,
      unique: true,
    })
    return filepaths
  }

  public async mkdirsIfNotExists(filepath: string, isDir: boolean): Promise<void> {
    const dirPath = isDir ? filepath : this.dirname(filepath)
    if (existsSync(dirPath)) return
    await mkdir(dirPath, { recursive: true })
  }

  public async readFile(filepath: string): Promise<IBinaryLike> {
    return await readFile(filepath)
  }

  public async statFile(filepath: string): Promise<IAssetStat> {
    return await stat(filepath)
  }

  public async unlinkFile(filepath: string): Promise<void> {
    return void (await unlink(filepath))
  }

  public watch(patterns: string[], options: IAssetWatchOptions): this {
    const { onAdd, onChange, onUnlink } = options
    chokidar
      .watch(patterns, { persistent: true, ...this.watchOptions, cwd: this.rootDir })
      .on('add', filepath => onAdd(filepath))
      .on('change', filepath => onChange(filepath))
      .on('unlink', filepath => onUnlink(filepath))
    return this
  }

  public async writeFile(
    filepath: string,
    content: string | IBinaryLike,
    encoding?: BufferEncoding,
  ): Promise<void> {
    await writeFile(filepath, content, encoding)
    this.onWriteFile?.(this, filepath, content, encoding)
  }
}
