import { AssetSourceStorage } from '@guanghechen/asset-storage'
import type {
  IAssetCollectOptions,
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

export interface IFileSourceAssetStorageProps {
  rootDir: string
  caseSensitive?: boolean
  watchOptions?: Partial<chokidar.WatchOptions>
}

export class FileSourceAssetStorage extends AssetSourceStorage implements IAssetSourceStorage {
  protected readonly _watchOptions: Partial<chokidar.WatchOptions>

  constructor(props: IFileSourceAssetStorageProps) {
    const { rootDir, caseSensitive = true, watchOptions = {} } = props

    super({ rootDir, caseSensitive })
    this._watchOptions = watchOptions
  }

  public override async assertExistedPath(filepath: string): Promise<void | never> {
    const absolutePath: string = this.absolute(filepath)
    invariant(existsSync(absolutePath), `[assertExistedPath] Cannot find file. (${filepath})`)
  }

  public override async assertExistedFile(filepath: string): Promise<void | never> {
    const absolutePath: string = this.absolute(filepath)
    invariant(existsSync(absolutePath), `[assertExistedFile] Cannot find file. (${filepath})`)

    const assertion: boolean = (await stat(absolutePath)).isFile()
    invariant(assertion, `[assertExistedFile] Not a file'. (${filepath})`)
  }

  public override async collectAssetSrcPaths(
    patterns: string[],
    options: IAssetCollectOptions,
  ): Promise<string[]> {
    const cwd = options.cwd || this.rootDir
    this.assertSafePath(cwd)

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

  public override async readBinaryFile(filepath: string): Promise<Buffer> {
    const absolutePath: string = this.absolute(filepath)
    return await readFile(absolutePath)
  }

  public override async readTextFile(filepath: string, encoding: BufferEncoding): Promise<string> {
    const absolutePath: string = this.absolute(filepath)
    return await readFile(absolutePath, encoding)
  }

  public override async readJsonFile(filepath: string): Promise<unknown> {
    const absolutePath: string = this.absolute(filepath)
    const content: string = await readFile(absolutePath, 'utf8')
    return JSON.parse(content)
  }

  public override async statFile(filepath: string): Promise<IAssetStat> {
    return await stat(filepath)
  }

  public override watch(patterns: string[], options: IAssetWatchOptions): IAssetWatcher {
    const { onAdd, onChange, onUnlink } = options
    const watcher = chokidar
      .watch(patterns, { persistent: true, ...this._watchOptions, cwd: this.rootDir })
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
