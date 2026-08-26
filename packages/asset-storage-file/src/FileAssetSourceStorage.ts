import { createAssetWatchPathMatcher } from '@guanghechen/asset-storage'
import type {
  IAssetCollectOptions,
  IAssetDecipher,
  IAssetPathResolver,
  IAssetSourceStorage,
  IAssetStat,
  IAssetWatchOptions,
  IAssetWatcher,
  IBinaryFileData,
} from '@guanghechen/asset-types'
import assertInvariant from '@guanghechen/invariant'
import { watch as watchFiles } from 'chokidar'
import type { ChokidarOptions } from 'chokidar'
import { existsSync } from 'node:fs'
import { opendir, readFile, stat as statFile, unlink, writeFile } from 'node:fs/promises'

interface IProps {
  pathResolver: IAssetPathResolver
  decipher?: IAssetDecipher
  watchOptions?: ChokidarOptions
}

const defaultDecipher: IAssetDecipher = {
  decode: async data => data,
}

export class FileAssetSourceStorage implements IAssetSourceStorage {
  protected readonly _decipher: IAssetDecipher
  protected readonly _pathResolver: IAssetPathResolver
  protected readonly _watchOptions: ChokidarOptions

  constructor(props: IProps) {
    const { pathResolver, decipher, watchOptions = {} } = props

    this._pathResolver = pathResolver
    this._decipher = decipher ?? defaultDecipher
    this._watchOptions = watchOptions
  }

  public async assertExistedFile(absoluteSrcPath: string): Promise<void | never> {
    this._pathResolver.assertSafeAbsolutePath(absoluteSrcPath)

    assertInvariant(
      existsSync(absoluteSrcPath),
      `[assertExistedFile] Cannot find file. (${absoluteSrcPath})`,
    )

    const assertion: boolean = (await statFile(absoluteSrcPath)).isFile()
    assertInvariant(assertion, `[assertExistedFile] Not a file. (${absoluteSrcPath})`)
  }

  public async existFile(absoluteSrcPath: string): Promise<boolean> {
    const srcRoot: string | null = this._pathResolver.findSrcRoot(absoluteSrcPath)
    if (srcRoot === null) return false
    if (!existsSync(absoluteSrcPath)) return false
    const stat = await statFile(absoluteSrcPath)
    return stat.isFile()
  }

  public async readFile(absoluteSrcPath: string): Promise<IBinaryFileData> {
    this._pathResolver.assertSafeAbsolutePath(absoluteSrcPath)
    const encodedData: IBinaryFileData = await readFile(absoluteSrcPath)
    const data: IBinaryFileData = await this._decipher.decode(encodedData)
    return data
  }

  public async removeFile(absoluteSrcPath: string): Promise<void> {
    this._pathResolver.assertSafeAbsolutePath(absoluteSrcPath)
    await unlink(absoluteSrcPath)
  }

  public async statFile(absoluteSrcPath: string): Promise<IAssetStat> {
    this._pathResolver.assertSafeAbsolutePath(absoluteSrcPath)
    const result: IAssetStat = await statFile(absoluteSrcPath)
    return result
  }

  public async updateFile(absoluteSrcPath: string, data: IBinaryFileData): Promise<void> {
    this._pathResolver.assertSafeAbsolutePath(absoluteSrcPath)
    await writeFile(absoluteSrcPath, data)
  }

  public watch(pathPatterns: ReadonlyArray<RegExp>, options: IAssetWatchOptions): IAssetWatcher {
    const { cwd, onAdd, onChange, onRemove, shouldIgnore = () => false } = options
    const pathResolver: IAssetPathResolver = this._pathResolver

    // Ensure the cwd is a safe absolute filepath.
    pathResolver.assertSafeAbsolutePath(cwd)

    if (pathPatterns.length === 0) return { unwatch: async (): Promise<void> => undefined }

    const isMatched = createAssetWatchPathMatcher(pathPatterns)
    const wrap = (callback: (filepath: string, resolver: IAssetPathResolver) => void) => {
      return (filepath: string): void => {
        const absoluteSrcPath: string = pathResolver.absolute(cwd, filepath)
        if (!isMatched(absoluteSrcPath)) return
        if (shouldIgnore(absoluteSrcPath, pathResolver)) return
        callback(absoluteSrcPath, pathResolver)
      }
    }

    const watcher = watchFiles('.', {
      persistent: true,
      ...this._watchOptions,
      cwd,
    })

    if (onAdd) watcher.on('add', wrap(onAdd))
    if (onChange) watcher.on('change', wrap(onChange))
    if (onRemove) watcher.on('unlink', wrap(onRemove))

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
    pathPatterns: ReadonlyArray<RegExp>,
    options: IAssetCollectOptions,
  ): Promise<string[]> {
    const cwd: string = options.cwd
    const pathResolver: IAssetPathResolver = this._pathResolver

    // Ensure the cwd is a safe absolute filepath.
    pathResolver.assertSafeAbsolutePath(cwd)

    if (pathPatterns.length === 0) return []

    const isMatched = createAssetWatchPathMatcher(pathPatterns)
    const filepaths: string[] = []
    const directory = await opendir(cwd, { recursive: true })
    for await (const entry of directory) {
      if (!entry.isFile()) continue
      const absoluteSrcPath: string = pathResolver.absolute(entry.parentPath, entry.name)
      if (isMatched(absoluteSrcPath)) filepaths.push(absoluteSrcPath)
    }
    return filepaths
  }
}
