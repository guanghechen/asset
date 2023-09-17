import type {
  IAssetCollectOptions,
  IAssetPathResolver,
  IAssetSourceStorage,
  IAssetStat,
  IAssetWatchOptions,
  IAssetWatcher,
  IBinaryFileData,
  IBinarySourceItem,
  IRawSourceItem,
  ISourceItem,
} from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import chokidar from 'chokidar'
import fastGlob from 'fast-glob'
import { existsSync } from 'node:fs'
import { readFile, stat, unlink, writeFile } from 'node:fs/promises'

export interface IFileAssetSourceStorageProps {
  pathResolver: IAssetPathResolver
  watchOptions?: Partial<chokidar.WatchOptions>
}

export class FileAssetSourceStorage implements IAssetSourceStorage {
  public readonly pathResolver: IAssetPathResolver
  protected readonly _watchOptions: Partial<chokidar.WatchOptions>

  constructor(props: IFileAssetSourceStorageProps) {
    const { pathResolver, watchOptions = {} } = props
    this.pathResolver = pathResolver
    this._watchOptions = watchOptions
  }

  public async assertExistedFile(filepath: string): Promise<void | never> {
    const absolutePath: string = this.pathResolver.absolute(filepath)
    invariant(existsSync(absolutePath), `[assertExistedFile] Cannot find file. (${filepath})`)

    const assertion: boolean = (await stat(absolutePath)).isFile()
    invariant(assertion, `[assertExistedFile] Not a file'. (${filepath})`)
  }

  public async collect(
    patterns_: Iterable<string>,
    options: IAssetCollectOptions,
  ): Promise<string[]> {
    const cwd: string = options.cwd || this.pathResolver.rootDir
    this.pathResolver.assertSafePath(cwd)

    const patterns: string[] = Array.from(patterns_)
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

  public async readFile(rawItem: IRawSourceItem): Promise<ISourceItem> {
    const filepath: string = this.pathResolver.absolute(rawItem.filepath)
    const stat = await this.statFile(filepath)
    const data: IBinaryFileData = await readFile(filepath)
    const item: IBinarySourceItem = { filepath, stat, data }
    return item
  }

  public async removeFile(srcPath: string): Promise<void> {
    const filepath: string = this.pathResolver.absolute(srcPath)
    await unlink(filepath)
  }

  public async statFile(srcPath: string): Promise<IAssetStat> {
    const filepath: string = this.pathResolver.absolute(srcPath)
    return await stat(filepath)
  }

  public async updateFile(item: ISourceItem): Promise<void> {
    const filepath: string = this.pathResolver.absolute(item.filepath)
    await writeFile(filepath, item.data)
  }

  public watch(patterns: string[], options: IAssetWatchOptions): IAssetWatcher {
    const { onAdd, onChange, onRemove, shouldIgnore = () => false } = options
    const { pathResolver, _watchOptions } = this

    const watcher = chokidar.watch(patterns, {
      persistent: true,
      ..._watchOptions,
      cwd: pathResolver.rootDir,
    })

    if (onAdd) {
      watcher.on('add', filepath => {
        if (shouldIgnore(filepath, pathResolver)) return
        onAdd(filepath, pathResolver)
      })
    }

    if (onChange) {
      watcher.on('change', filepath => {
        if (shouldIgnore(filepath, pathResolver)) return
        onChange(filepath, pathResolver)
      })
    }

    if (onRemove) {
      watcher.on('unlink', filepath => {
        if (shouldIgnore(filepath, pathResolver)) return
        onRemove(filepath, pathResolver)
      })
    }

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
