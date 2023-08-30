import { AssetTargetStorage } from '@guanghechen/asset-storage'
import { AssetDataType, FileType } from '@guanghechen/asset-types'
import type {
  IAssetCollectOptions,
  IAssetSourceStorage,
  IAssetStat,
  IAssetTargetStorage,
  IAssetWatchOptions,
  IAssetWatcher,
  IBinaryFileItem,
  IJsonFileItem,
  ITextFileItem,
} from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import chokidar from 'chokidar'
import fastGlob from 'fast-glob'
import { existsSync } from 'node:fs'
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'

export interface IFileAssetStorageProps {
  rootDir: string
  prettier?: boolean
  watchOptions?: Partial<chokidar.WatchOptions>
}

export class FileAssetStorage
  extends AssetTargetStorage
  implements IAssetSourceStorage, IAssetTargetStorage
{
  protected readonly prettier: boolean
  protected readonly watchOptions: Partial<chokidar.WatchOptions>

  constructor(props: IFileAssetStorageProps) {
    super({ rootDir: props.rootDir })
    this.prettier = props.prettier ?? true
    this.watchOptions = props.watchOptions ?? {}
  }

  public async assertExistedLocation(location: string): Promise<void | never> {
    const absoluteLocation: string = this.absolute(location)
    invariant(
      existsSync(absoluteLocation),
      `[assertExistedLocation] Cannot find file. (${location})`,
    )
  }

  public async assertExistedFile(location: string): Promise<void | never> {
    const absoluteLocation: string = this.absolute(location)
    invariant(existsSync(absoluteLocation), `[assertExistedFile] Cannot find file. (${location})`)

    const assertion: boolean = (await stat(absoluteLocation)).isFile()
    invariant(assertion, `[assertExistedFile] Not a file'. (${location})`)
  }

  public async collectAssetLocations(
    patterns: string[],
    options: IAssetCollectOptions,
  ): Promise<string[]> {
    const cwd = options.cwd || this.rootDir
    this.assertSafeLocation(cwd)

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

  public async readBinaryFile(filepath: string): Promise<Buffer> {
    const absolutePath: string = this.absolute(filepath)
    return await readFile(absolutePath)
  }

  public async readTextFile(filepath: string, encoding: BufferEncoding): Promise<string> {
    const absolutePath: string = this.absolute(filepath)
    return await readFile(absolutePath, encoding)
  }

  public async readJsonFile(filepath: string): Promise<unknown> {
    const absolutePath: string = this.absolute(filepath)
    const content: string = await readFile(absolutePath, 'utf8')
    return JSON.parse(content)
  }

  public async writeBinaryFile(filepath: string, content: Buffer): Promise<void> {
    const absolutePath: string = this.absolute(filepath)
    await writeFile(absolutePath, content)

    const fileStat = await stat(filepath)
    const newItem: IBinaryFileItem = {
      type: FileType.FILE,
      contentType: AssetDataType.BINARY,
      absolutePath,
      content,
      encoding: undefined,
      stat: {
        birthtime: fileStat.birthtime,
        mtime: fileStat.mtime,
      },
    }

    // Notify
    this._monitors.onWrittenBinaryFile.notify(newItem)
    this._monitors.onWrittenFile.notify(newItem)
  }

  public async writeTextFile(
    filepath: string,
    content: string,
    encoding: BufferEncoding,
  ): Promise<void> {
    const absolutePath: string = this.absolute(filepath)
    await writeFile(absolutePath, content, encoding)

    const fileStat = await stat(filepath)
    const newItem: ITextFileItem = {
      type: FileType.FILE,
      contentType: AssetDataType.TEXT,
      absolutePath,
      content,
      encoding,
      stat: {
        birthtime: fileStat.birthtime,
        mtime: fileStat.mtime,
      },
    }

    // Notify
    this._monitors.onWrittenTextFile.notify(newItem)
    this._monitors.onWrittenFile.notify(newItem)
  }

  public async writeJsonFile(filepath: string, content: unknown): Promise<void> {
    const absolutePath: string = this.absolute(filepath)
    const s: string = this.prettier ? JSON.stringify(content, null, 2) : JSON.stringify(content)
    await writeFile(absolutePath, s, 'utf8')

    const fileStat = await stat(filepath)
    const newItem: IJsonFileItem = {
      type: FileType.FILE,
      contentType: AssetDataType.JSON,
      absolutePath,
      content,
      encoding: undefined,
      stat: {
        birthtime: fileStat.birthtime,
        mtime: fileStat.mtime,
      },
    }

    // Notify
    this._monitors.onWrittenJsonFile.notify(newItem)
    this._monitors.onWrittenFile.notify(newItem)
  }

  public async statFile(filepath: string): Promise<IAssetStat> {
    return await stat(filepath)
  }

  public async unlinkFile(filepath: string): Promise<void> {
    return void (await unlink(filepath))
  }

  public watch(patterns: string[], options: IAssetWatchOptions): IAssetWatcher {
    const { onAdd, onChange, onUnlink } = options
    const watcher = chokidar
      .watch(patterns, { persistent: true, ...this.watchOptions, cwd: this.rootDir })
      .on('add', filepath => onAdd(filepath))
      .on('change', filepath => onChange(filepath))
      .on('unlink', filepath => onUnlink(filepath))

    let unWatching = false
    return {
      unwatch: async (): Promise<void> => {
        if (unWatching) return
        unWatching = true

        await watcher.close()
      },
    }
  }
}