import type {
  IAssetCollectOptions,
  IAssetPathResolver,
  IAssetSourceStorage,
  IAssetStat,
  IAssetWatchOptions,
  IAssetWatcher,
} from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import chokidar from 'chokidar'
import fastGlob from 'fast-glob'
import { existsSync } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'

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

  public async collectAssetSrcPaths(
    patterns: string[],
    options: IAssetCollectOptions,
  ): Promise<string[]> {
    const cwd = options.cwd || this.pathResolver.rootDir
    this.pathResolver.assertSafePath(cwd)

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

  public async readBinaryFile(filepath: string): Promise<Buffer> {
    const absolutePath: string = this.pathResolver.absolute(filepath)
    return await readFile(absolutePath)
  }

  public async readTextFile(filepath: string, encoding: BufferEncoding): Promise<string> {
    const absolutePath: string = this.pathResolver.absolute(filepath)
    return await readFile(absolutePath, encoding)
  }

  public async readJsonFile(filepath: string): Promise<unknown> {
    const absolutePath: string = this.pathResolver.absolute(filepath)
    const content: string = await readFile(absolutePath, 'utf8')
    return JSON.parse(content)
  }

  public async statFile(filepath: string): Promise<IAssetStat> {
    return await stat(filepath)
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
