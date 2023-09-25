import { AssetSourceStorage } from '@guanghechen/asset-storage'
import type {
  IAssetCollectOptions,
  IAssetPathResolver,
  IAssetSourceStorage,
  IAssetStat,
  IAssetWatchOptions,
  IAssetWatcher,
  IBinaryFileData,
  IEncodingDetector,
  IRawSourceItem,
  ISourceItem,
} from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import chokidar from 'chokidar'
import fastGlob from 'fast-glob'
import { existsSync } from 'node:fs'
import { readFile, stat, unlink, writeFile } from 'node:fs/promises'

interface IProps {
  pathResolver: IAssetPathResolver
  encodingDetector: IEncodingDetector
  watchOptions?: Partial<chokidar.WatchOptions>
}

export class FileAssetSourceStorage extends AssetSourceStorage implements IAssetSourceStorage {
  protected readonly _watchOptions: Partial<chokidar.WatchOptions>

  constructor(props: IProps) {
    const { pathResolver, encodingDetector, watchOptions = {} } = props

    super({ pathResolver, encodingDetector })
    this._watchOptions = watchOptions
  }

  public override async assertExistedFile(srcPath: string): Promise<void | never> {
    const filepath: string = this.pathResolver.absolute(srcPath)
    invariant(existsSync(filepath), `[assertExistedFile] Cannot find file. (${srcPath})`)

    const assertion: boolean = (await stat(filepath)).isFile()
    invariant(assertion, `[assertExistedFile] Not a file. (${srcPath})`)
  }

  public override async collect(
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

  public override async readFile(srcPath: string): Promise<IBinaryFileData> {
    const filepath: string = this.pathResolver.absolute(srcPath)
    const data: IBinaryFileData = await readFile(filepath)
    return data
  }

  public override async removeFile(srcPath: string): Promise<void> {
    const filepath: string = this.pathResolver.absolute(srcPath)
    await unlink(filepath)
  }

  public override async statFile(srcPath: string): Promise<IAssetStat> {
    const filepath: string = this.pathResolver.absolute(srcPath)
    return await stat(filepath)
  }

  public override async updateFile(srcPath: string, data: IBinaryFileData): Promise<void> {
    const filepath: string = this.pathResolver.absolute(srcPath)
    await writeFile(filepath, data)
  }

  public override watch(patterns: string[], options: IAssetWatchOptions): IAssetWatcher {
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
