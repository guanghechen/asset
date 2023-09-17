import type {
  IAssetCollectOptions,
  IAssetFileChangedCallback,
  IAssetLoadOnDemand,
  IAssetPathResolver,
  IAssetSourceStorage,
  IAssetStat,
  IAssetWatchOptions,
  IAssetWatcher,
  ISourceItem,
} from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import { Monitor } from '@guanghechen/monitor'
import type { IMonitor } from '@guanghechen/monitor'
import micromatch from 'micromatch'

type IParametersOfOnAdd = [filepath: string, pathResolver: IAssetPathResolver]
type IParametersOfOnChange = [filepath: string, pathResolver: IAssetPathResolver]
type IParametersOfOnRemove = [filepath: string, pathResolver: IAssetPathResolver]

export interface IMemoAssetSourceStorageProps {
  pathResolver: IAssetPathResolver
  initialData?: Iterable<[string, ISourceItem]>
  loadOnDemand?: IAssetLoadOnDemand
}

export class MemoAssetSourceStorage implements IAssetSourceStorage {
  public readonly pathResolver: IAssetPathResolver
  protected readonly _cache: Map<string, ISourceItem>
  protected readonly _monitorAdd: IMonitor<IParametersOfOnAdd>
  protected readonly _monitorChange: IMonitor<IParametersOfOnChange>
  protected readonly _monitorRemove: IMonitor<IParametersOfOnRemove>
  protected readonly _loadOnDemand: IAssetLoadOnDemand

  constructor(props: IMemoAssetSourceStorageProps) {
    const { pathResolver, initialData, loadOnDemand } = props
    this.pathResolver = pathResolver
    this._cache = new Map(initialData)
    this._monitorAdd = new Monitor<IParametersOfOnAdd>('onAdd')
    this._monitorChange = new Monitor<IParametersOfOnChange>('onChange')
    this._monitorRemove = new Monitor<IParametersOfOnRemove>('onRemove')
    this._loadOnDemand = loadOnDemand ?? (async () => undefined)
  }

  public async assertExistedFile(srcPath: string): Promise<void> {
    const filepath: string = this.pathResolver.relative(srcPath)
    const identifier: string = this.pathResolver.identify(filepath)
    const existed: boolean = this._cache.has(identifier)
    if (existed) return

    const loadResult = await this._loadOnDemand(filepath, this.pathResolver)
    if (loadResult !== undefined) {
      const item: ISourceItem = { filepath, stat: loadResult.stat, data: loadResult.data }
      await this.updateFile(item)
      return
    }

    throw new Error(`[${this.constructor.name}.assertExistedFile] invalid filepath: ${filepath}`)
  }

  public async collect(
    patterns_: Iterable<string>,
    options: IAssetCollectOptions,
  ): Promise<string[]> {
    const cwd: string = options.cwd || this.pathResolver.rootDir
    this.pathResolver.assertSafePath(cwd)

    const patterns: string[] = Array.from(patterns_)
    const filepaths: string[] = []
    for (const item of this._cache.values()) {
      const filepath: string = this.pathResolver.relative(item.filepath)
      if (micromatch.isMatch(filepath, patterns, { dot: true })) filepaths.push(filepath)
    }
    return filepaths
  }

  public async readFile(srcPath: string): Promise<ISourceItem> {
    const filepath: string = this.pathResolver.relative(srcPath)
    const identifier: string = this.pathResolver.identify(filepath)
    let item: ISourceItem | undefined = this._cache.get(identifier)

    if (item === undefined) {
      const loadResult = await this._loadOnDemand(filepath, this.pathResolver)
      if (loadResult !== undefined) {
        item = {
          filepath,
          stat: { birthtime: loadResult.stat.birthtime, mtime: loadResult.stat.mtime },
          data: loadResult.data,
        }
        this._cache.set(identifier, item)
        this._monitorAdd.notify(filepath, this.pathResolver)
      }
    }

    invariant(!!item, `[${this.constructor.name}.readFile] invalid filepath: ${filepath}`)
    return item
  }

  public async removeFile(srcPath: string): Promise<void> {
    const filepath: string = this.pathResolver.relative(srcPath)
    const identifier: string = this.pathResolver.identify(filepath)
    const item: ISourceItem | undefined = this._cache.get(identifier)
    invariant(!!item, `[${this.constructor.name}.removeFile] invalid filepath: ${filepath}`)
    this._cache.delete(identifier)
    this._monitorRemove.notify(filepath, this.pathResolver)
  }

  public async statFile(srcPath: string): Promise<IAssetStat> {
    const filepath: string = this.pathResolver.relative(srcPath)
    const identifier: string = this.pathResolver.identify(filepath)
    const item: ISourceItem | undefined = this._cache.get(identifier)
    invariant(!!item, `[${this.constructor.name}.statFile] invalid filepath: ${filepath}`)
    return item.stat
  }

  public async updateFile(item: ISourceItem): Promise<void> {
    const filepath: string = this.pathResolver.relative(item.filepath)
    const identifier: string = this.pathResolver.identify(filepath)
    const existItem: ISourceItem | undefined = this._cache.get(identifier)
    const resolvedItem: ISourceItem = {
      filepath,
      stat: {
        birthtime: existItem?.stat?.birthtime ?? item.stat.birthtime,
        mtime: item.stat.mtime,
      },
      data: item.data,
    }

    if (existItem) {
      this._cache.set(identifier, resolvedItem)
      this._monitorChange.notify(filepath, this.pathResolver)
      return
    } else {
      this._cache.set(identifier, resolvedItem)
      this._monitorAdd.notify(filepath, this.pathResolver)
    }
  }

  public watch(patterns: string[], options: IAssetWatchOptions): IAssetWatcher {
    const { onAdd, onChange, onRemove, shouldIgnore = () => false } = options
    const pathResolver: IAssetPathResolver = this.pathResolver
    const wrapper = (fn: IAssetFileChangedCallback): ((filepath: string) => void) => {
      return (filepath_: string): void => {
        const filepath: string = pathResolver.relative(filepath_)
        if (shouldIgnore(filepath, pathResolver)) return
        if (micromatch.isMatch(filepath, patterns, { dot: true })) {
          fn(filepath, pathResolver)
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
        unsubscribeOnAdd?.()
        unsubscribeOnChange?.()
        unsubscribeOnRemove?.()
      },
    }
  }
}
