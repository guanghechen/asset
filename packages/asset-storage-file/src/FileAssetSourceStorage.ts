import type {
  IAssetCollectOptions,
  IAssetPathResolver,
  IAssetSourceStorage,
  IAssetStat,
  IAssetWatchOptions,
  IAssetWatcher,
  IBinaryFileData,
  IEncodingDetector,
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

export class FileAssetSourceStorage implements IAssetSourceStorage {
  protected readonly _pathResolver: IAssetPathResolver
  protected readonly _encodingDetector: IEncodingDetector
  protected readonly _watchOptions: Partial<chokidar.WatchOptions>

  constructor(props: IProps) {
    const { pathResolver, encodingDetector, watchOptions = {} } = props

    this._pathResolver = pathResolver
    this._encodingDetector = encodingDetector
    this._watchOptions = watchOptions
  }

  public async assertExistedFile(absoluteSrcPath: string): Promise<void | never> {
    this._pathResolver.assertSafeAbsolutePath(absoluteSrcPath)

    invariant(
      existsSync(absoluteSrcPath),
      `[assertExistedFile] Cannot find file. (${absoluteSrcPath})`,
    )

    const assertion: boolean = (await stat(absoluteSrcPath)).isFile()
    invariant(assertion, `[assertExistedFile] Not a file. (${absoluteSrcPath})`)
  }

  public async detectEncoding(absoluteSrcPath: string): Promise<BufferEncoding | undefined> {
    this._pathResolver.assertSafeAbsolutePath(absoluteSrcPath)
    const loadData = (): Promise<IBinaryFileData> => this.readFile(absoluteSrcPath)
    const encoding = await this._encodingDetector.detect(absoluteSrcPath, loadData)
    return encoding
  }

  public async readFile(absoluteSrcPath: string): Promise<IBinaryFileData> {
    this._pathResolver.assertSafeAbsolutePath(absoluteSrcPath)
    const data: IBinaryFileData = await readFile(absoluteSrcPath)
    return data
  }

  public async removeFile(absoluteSrcPath: string): Promise<void> {
    this._pathResolver.assertSafeAbsolutePath(absoluteSrcPath)
    await unlink(absoluteSrcPath)
  }

  public async statFile(absoluteSrcPath: string): Promise<IAssetStat> {
    this._pathResolver.assertSafeAbsolutePath(absoluteSrcPath)
    const result: IAssetStat = await stat(absoluteSrcPath)
    return result
  }

  public async updateFile(absoluteSrcPath: string, data: IBinaryFileData): Promise<void> {
    this._pathResolver.assertSafeAbsolutePath(absoluteSrcPath)
    await writeFile(absoluteSrcPath, data)
  }

  public watch(patterns: string[], options: IAssetWatchOptions): IAssetWatcher {
    const { cwd, onAdd, onChange, onRemove, shouldIgnore = () => false } = options
    const pathResolver: IAssetPathResolver = this._pathResolver

    // Ensure the cwd is a safe absolute filepath.
    pathResolver.assertSafeAbsolutePath(cwd)

    const watcher = chokidar.watch(patterns, {
      persistent: true,
      ...this._watchOptions,
      cwd,
    })

    if (onAdd) {
      watcher.on('add', filepath => {
        const absoluteSrcPath: string = pathResolver.absolute(cwd, filepath)
        if (shouldIgnore(absoluteSrcPath, pathResolver)) return
        onAdd(absoluteSrcPath, pathResolver)
      })
    }

    if (onChange) {
      watcher.on('change', filepath => {
        const absoluteSrcPath: string = pathResolver.absolute(cwd, filepath)
        if (shouldIgnore(absoluteSrcPath, pathResolver)) return
        onChange(absoluteSrcPath, pathResolver)
      })
    }

    if (onRemove) {
      watcher.on('unlink', filepath => {
        const absoluteSrcPath: string = pathResolver.absolute(cwd, filepath)
        if (shouldIgnore(absoluteSrcPath, pathResolver)) return
        onRemove(absoluteSrcPath, pathResolver)
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

  public async collect(
    patterns_: Iterable<string>,
    options: IAssetCollectOptions,
  ): Promise<string[]> {
    const cwd: string = options.cwd
    const pathResolver: IAssetPathResolver = this._pathResolver

    // Ensure the cwd is a safe absolute filepath.
    pathResolver.assertSafeAbsolutePath(cwd)

    const patterns: string[] = Array.from(patterns_)
    const filepaths: string[] = await fastGlob(patterns, {
      cwd,
      dot: true,
      absolute: true,
      onlyDirectories: false,
      onlyFiles: true,
      throwErrorOnBrokenSymbolicLink: true,
      unique: true,
    })
    return filepaths
  }
}
