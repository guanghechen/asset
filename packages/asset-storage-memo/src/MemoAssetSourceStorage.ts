import type {
  IAssetCollectOptions,
  IAssetFileChangedCallback,
  IAssetPathResolver,
  IAssetSourceStorage,
  IAssetStat,
  IAssetWatchOptions,
  IAssetWatcher,
  IRawSourceItem,
  ISourceItem,
} from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import { Monitor } from '@guanghechen/monitor'
import type { IMonitor } from '@guanghechen/monitor'
import micromatch from 'micromatch'

type IParametersOfOnAdd = [filepath: string]
type IParametersOfOnChange = [filepath: string]
type IParametersOfOnRemove = [filepath: string]

export interface IMemoAssetSourceStorageProps {
  pathResolver: IAssetPathResolver
  initialData?: Iterable<[string, ISourceItem]>
}

export class MemoAssetSourceStorage implements IAssetSourceStorage {
  public readonly pathResolver: IAssetPathResolver
  protected readonly _cache: Map<string, ISourceItem>
  protected readonly _monitorAdd: IMonitor<IParametersOfOnAdd>
  protected readonly _monitorChange: IMonitor<IParametersOfOnChange>
  protected readonly _monitorRemove: IMonitor<IParametersOfOnRemove>

  constructor(props: IMemoAssetSourceStorageProps) {
    const { pathResolver, initialData } = props
    this.pathResolver = pathResolver
    this._cache = new Map(initialData)
    this._monitorAdd = new Monitor<IParametersOfOnAdd>('onAdd')
    this._monitorChange = new Monitor<IParametersOfOnChange>('onChange')
    this._monitorRemove = new Monitor<IParametersOfOnRemove>('onRemove')
  }

  public async assertExistedFile(srcPath: string): Promise<void> {
    const filepath: string = this.pathResolver.relative(srcPath)
    const identifier: string = this.pathResolver.identify(filepath)
    const existed: boolean = this._cache.has(identifier)
    invariant(existed, `[${this.constructor.name}.assertExistedFile] invalid filepath: ${filepath}`)
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

  public async readFile(rawItem: IRawSourceItem): Promise<ISourceItem> {
    const filepath: string = this.pathResolver.relative(rawItem.filepath)
    const identifier: string = this.pathResolver.identify(filepath)
    const item: ISourceItem | undefined = this._cache.get(identifier)
    invariant(
      !!item && item.datatype === rawItem.datatype,
      `[${this.constructor.name}.readFile] invalid filepath: ${filepath}`,
    )
    return item
  }

  public async removeFile(filepath: string): Promise<void> {
    const identifier: string = this.pathResolver.identify(filepath)
    const item: ISourceItem | undefined = this._cache.get(identifier)
    invariant(!!item, `[${this.constructor.name}.removeFile] invalid filepath: ${filepath}`)
    this._cache.delete(identifier)
    this._monitorRemove.notify(filepath)
  }

  public async statFile(filepath_: string): Promise<IAssetStat> {
    const filepath: string = this.pathResolver.relative(filepath_)
    const identifier: string = this.pathResolver.identify(filepath)
    const item: ISourceItem | undefined = this._cache.get(identifier)
    invariant(!!item, `[${this.constructor.name}.statFile] invalid filepath: ${filepath}`)
    return item.stat
  }

  public async updateFile(item: ISourceItem): Promise<void> {
    const filepath: string = this.pathResolver.relative(item.filepath)
    const identifier: string = this.pathResolver.identify(filepath)
    const existItem: ISourceItem | undefined = this._cache.get(identifier)

    if (existItem) {
      invariant(
        existItem.datatype === item.datatype,
        `[${this.constructor.name}.updateFile] invalid filepath: ${filepath}`,
      )
      this._cache.set(identifier, { ...item })
      this._monitorChange.notify(filepath)
      return
    }

    this._cache.set(identifier, { ...item })
    this._monitorAdd.notify(filepath)
  }

  public watch(patterns: string[], options: IAssetWatchOptions): IAssetWatcher {
    const { onAdd, onChange, onRemove, shouldIgnore = () => false } = options
    const { pathResolver } = this

    const wrapper = (fn: IAssetFileChangedCallback): ((filepath: string) => void) => {
      return (filepath: string): void => {
        const relativeFilepath: string = pathResolver.relative(filepath)
        if (shouldIgnore(relativeFilepath, pathResolver)) return
        if (micromatch.isMatch(relativeFilepath, patterns, { dot: true })) {
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
