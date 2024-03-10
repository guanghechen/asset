import type {
  IAssetCollectOptions,
  IAssetFileChangedCallback,
  IAssetPathResolver,
  IAssetSourceStorage,
  IAssetStat,
  IAssetWatchOptions,
  IAssetWatcher,
  IBinaryFileData,
  IMemoAssetSourceDataStorage,
  ISourceItem,
} from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import { Monitor } from '@guanghechen/monitor'
import type { IMonitor } from '@guanghechen/monitor'
import micromatch from 'micromatch'

type IParametersOfOnAdd = [absoluteSrcPath: string, pathResolver: IAssetPathResolver]
type IParametersOfOnChange = [absoluteSrcPath: string, pathResolver: IAssetPathResolver]
type IParametersOfOnRemove = [absoluteSrcPath: string, pathResolver: IAssetPathResolver]

interface IProps {
  dataStore: IMemoAssetSourceDataStorage
  pathResolver: IAssetPathResolver
}

export class MemoAssetSourceStorage implements IAssetSourceStorage {
  protected readonly _dataStore: IMemoAssetSourceDataStorage
  protected readonly _pathResolver: IAssetPathResolver
  protected readonly _monitorAdd: IMonitor<IParametersOfOnAdd>
  protected readonly _monitorChange: IMonitor<IParametersOfOnChange>
  protected readonly _monitorRemove: IMonitor<IParametersOfOnRemove>

  constructor(props: IProps) {
    const { dataStore, pathResolver } = props

    this._dataStore = dataStore
    this._pathResolver = pathResolver
    this._monitorAdd = new Monitor<IParametersOfOnAdd>('onAdd')
    this._monitorChange = new Monitor<IParametersOfOnChange>('onChange')
    this._monitorRemove = new Monitor<IParametersOfOnRemove>('onRemove')
  }

  public async assertExistedFile(absoluteSrcPath: string): Promise<void | never> {
    const srcRoot: string = this._pathResolver.assertSafeAbsolutePath(absoluteSrcPath)
    if (this._dataStore.has(absoluteSrcPath)) return

    const loadResult = await this._dataStore.loadOnDemand(absoluteSrcPath)
    if (loadResult !== undefined) {
      const item: ISourceItem = {
        srcRoot,
        absoluteSrcPath,
        stat: loadResult.stat,
        data: loadResult.data,
      }
      this._dataStore.set(absoluteSrcPath, item)
      this._monitorAdd.notify(absoluteSrcPath, this._pathResolver)
      return
    }

    throw new Error(
      `[${this.constructor.name}.assertExistedFile] invalid filepath: ${absoluteSrcPath}`,
    )
  }

  public async existFile(absoluteSrcPath: string): Promise<boolean> {
    const srcRoot: string | null = this._pathResolver.findSrcRoot(absoluteSrcPath)
    if (srcRoot === null) return false
    if (this._dataStore.has(absoluteSrcPath)) return true

    const loadResult = await this._dataStore.loadOnDemand(absoluteSrcPath)
    if (loadResult === undefined) return false
    return true
  }

  public async readFile(absoluteSrcPath: string): Promise<IBinaryFileData> {
    const srcRoot: string = this._pathResolver.assertSafeAbsolutePath(absoluteSrcPath)

    let item: ISourceItem | undefined = this._dataStore.get(absoluteSrcPath)
    if (item === undefined) {
      const loadResult = await this._dataStore.loadOnDemand(absoluteSrcPath)
      if (loadResult !== undefined) {
        item = {
          srcRoot,
          absoluteSrcPath,
          stat: { birthtime: loadResult.stat.birthtime, mtime: loadResult.stat.mtime },
          data: loadResult.data,
        }
        this._dataStore.set(absoluteSrcPath, item)
        this._monitorAdd.notify(absoluteSrcPath, this._pathResolver)
      }
    }

    invariant(!!item, `[${this.constructor.name}.readFile] invalid filepath: ${absoluteSrcPath}`)
    return item.data
  }

  public async removeFile(absoluteSrcPath: string): Promise<void> {
    this._pathResolver.assertSafeAbsolutePath(absoluteSrcPath)
    const item: ISourceItem | undefined = this._dataStore.get(absoluteSrcPath)
    invariant(!!item, `[${this.constructor.name}.removeFile] invalid filepath: ${absoluteSrcPath}`)
    this._dataStore.delete(absoluteSrcPath)
    this._monitorRemove.notify(absoluteSrcPath, this._pathResolver)
  }

  public async statFile(absoluteSrcPath: string): Promise<IAssetStat> {
    this._pathResolver.assertSafeAbsolutePath(absoluteSrcPath)

    let item: ISourceItem | undefined = this._dataStore.get(absoluteSrcPath)
    if (item === undefined) {
      await this.readFile(absoluteSrcPath)
      item = this._dataStore.get(absoluteSrcPath)
    }

    invariant(!!item, `[${this.constructor.name}.statFile] invalid filepath: ${absoluteSrcPath}`)
    return item.stat
  }

  public async updateFile(absoluteSrcPath: string, data: IBinaryFileData): Promise<void> {
    const srcRoot: string = this._pathResolver.assertSafeAbsolutePath(absoluteSrcPath)
    const existItem: ISourceItem | undefined = this._dataStore.get(absoluteSrcPath)
    const mtime: Date = new Date()
    const birthtime = existItem?.stat.birthtime ?? mtime
    const resolvedItem: ISourceItem = {
      srcRoot,
      absoluteSrcPath,
      stat: { birthtime, mtime },
      data,
    }

    if (existItem) {
      this._dataStore.set(absoluteSrcPath, resolvedItem)
      this._monitorChange.notify(absoluteSrcPath, this._pathResolver)
      return
    } else {
      this._dataStore.set(absoluteSrcPath, resolvedItem)
      this._monitorAdd.notify(absoluteSrcPath, this._pathResolver)
    }
  }

  public watch(patterns: string[], options: IAssetWatchOptions): IAssetWatcher {
    const { cwd, onAdd, onChange, onRemove, shouldIgnore = () => false } = options
    const pathResolver: IAssetPathResolver = this._pathResolver

    // Ensure the cwd is a safe absolute filepath.
    pathResolver.assertSafeAbsolutePath(cwd)

    const wrapper = (fn: IAssetFileChangedCallback): ((filepath: string) => void) => {
      return (filepath: string): void => {
        const absoluteSrcPath: string = pathResolver.absolute(cwd, filepath)
        if (shouldIgnore(absoluteSrcPath, pathResolver)) return
        if (micromatch.isMatch(absoluteSrcPath, patterns, { dot: true })) {
          fn(absoluteSrcPath, pathResolver)
        }
      }
    }

    const unsubscribeOnAdd = onAdd ? this._monitorAdd.subscribe(wrapper(onAdd)) : undefined
    const unsubscribeOnChange = onChange
      ? this._monitorChange.subscribe(wrapper(onChange))
      : undefined
    const unsubscribeOnRemove = onRemove
      ? this._monitorRemove.subscribe(wrapper(onRemove))
      : undefined

    return {
      unwatch: async (): Promise<void> => {
        unsubscribeOnAdd?.unsubscribe()
        unsubscribeOnChange?.unsubscribe()
        unsubscribeOnRemove?.unsubscribe()
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
    const filepaths: string[] = []
    for (const item of this._dataStore.values()) {
      if (pathResolver.isRelativePath(item.srcRoot, cwd)) {
        const filepath: string = pathResolver.relative(cwd, item.absoluteSrcPath)
        if (micromatch.isMatch(filepath, patterns, { dot: true })) {
          filepaths.push(item.absoluteSrcPath)
        }
      }
    }
    return filepaths
  }
}
