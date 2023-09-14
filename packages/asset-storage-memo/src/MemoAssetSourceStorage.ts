import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import type {
  IAssetCollectOptions,
  IAssetPathResolver,
  IAssetSourceStorage,
  IAssetStat,
  IAssetWatchOptions,
  IAssetWatcher,
  IFileItem,
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
  initialData: Iterable<[string, IFileItem]>
}

export class MemoAssetSourceStorage implements IAssetSourceStorage {
  public readonly pathResolver: IAssetPathResolver
  protected readonly _cache: Map<string, IFileItem>
  protected readonly _monitors: {
    onAdd: IMonitor<IParametersOfOnAdd>
    onChange: IMonitor<IParametersOfOnChange>
    onRemove: IMonitor<IParametersOfOnRemove>
  }

  constructor(props: IMemoAssetSourceStorageProps) {
    const { pathResolver, initialData } = props
    this.pathResolver = pathResolver
    this._cache = new Map(initialData)
    this._monitors = {
      onAdd: new Monitor<IParametersOfOnAdd>('onAdd'),
      onChange: new Monitor<IParametersOfOnChange>('onChange'),
      onRemove: new Monitor<IParametersOfOnRemove>('onRemove'),
    }
  }

  public async removeFile(filepath: string): Promise<void> {
    const identifier = this.pathResolver.identify(filepath)
    const item = this._cache.get(identifier)
    invariant(!!item, `[${this.constructor.name}.removeFile] invalid filepath: ${filepath}`)
    this._cache.delete(identifier)
    this._monitors.onRemove.notify(filepath)
  }

  public async updateFile(item: IFileItem): Promise<void> {
    const identifier = this.pathResolver.identify(item.absolutePath)
    const existItem = this._cache.get(identifier)

    if (existItem) {
      invariant(
        existItem.datatype === item.datatype,
        `[${this.constructor.name}.updateFile] invalid filepath: ${item.absolutePath}`,
      )
      this._cache.set(identifier, { ...item })
      this._monitors.onChange.notify(item.absolutePath)
      return
    }

    this._cache.set(identifier, { ...item })
    this._monitors.onAdd.notify(item.absolutePath)
  }

  /** Below are override methods */

  public async assertExistedFile(srcPath: string): Promise<void> {
    const identifier = this.pathResolver.identify(srcPath)
    const item = this._cache.get(identifier)
    invariant(!!item, `[${this.constructor.name}.assertExistedFile] invalid filepath: ${srcPath}`)
  }

  public async collectAssetSrcPaths(
    patterns: string[],
    options: IAssetCollectOptions,
  ): Promise<string[]> {
    const cwd = options.cwd || this.pathResolver.rootDir
    this.pathResolver.assertSafePath(cwd)

    const filepaths: string[] = []
    for (const item of this._cache.values()) {
      const relativeFilepath: string = this.pathResolver.relative(item.absolutePath)
      if (micromatch.isMatch(relativeFilepath, patterns, { dot: true })) {
        filepaths.push(item.absolutePath)
      }
    }
    return filepaths
  }

  public async readBinaryFile(filepath: string): Promise<Buffer> {
    const identifier = this.pathResolver.identify(filepath)
    const item = this._cache.get(identifier)
    invariant(
      !!item && item.datatype === AssetDataTypeEnum.BINARY,
      `[${this.constructor.name}.readBinaryFile] invalid filepath: ${filepath}`,
    )
    return item.data
  }

  public async readTextFile(filepath: string): Promise<string> {
    const identifier = this.pathResolver.identify(filepath)
    const item = this._cache.get(identifier)
    invariant(
      !!item && item.datatype === AssetDataTypeEnum.TEXT,
      `[${this.constructor.name}.readTextFile] invalid filepath: ${filepath}`,
    )
    return item.data
  }

  public async readJsonFile(filepath: string): Promise<unknown> {
    const identifier = this.pathResolver.identify(filepath)
    const item = this._cache.get(identifier)
    invariant(
      !!item && item.datatype === AssetDataTypeEnum.JSON,
      `[${this.constructor.name}.readJsonFile] invalid filepath: ${filepath}`,
    )
    return item.data
  }

  public async statFile(filepath: string): Promise<IAssetStat> {
    const identifier = this.pathResolver.identify(filepath)
    const item = this._cache.get(identifier)
    invariant(!!item, `[${this.constructor.name}.statFile] invalid filepath: ${filepath}`)
    return item.stat
  }

  public watch(patterns: string[], options: IAssetWatchOptions): IAssetWatcher {
    const { onAdd, onChange, onRemove } = options
    type ICallback = (filepath: string) => void

    const wrapper = (fn: ICallback): ICallback => {
      return (filepath: string): void => {
        const relativeFilepath: string = this.pathResolver.relative(filepath)
        if (micromatch.isMatch(relativeFilepath, patterns, { dot: true })) fn(filepath)
      }
    }

    const unsubscribeOnAdd = this._monitors.onAdd.subscribe(wrapper(onAdd))
    const unsubscribeOnChange = this._monitors.onChange.subscribe(wrapper(onChange))
    const unsubscribeOnRemove = this._monitors.onRemove.subscribe(wrapper(onRemove))

    return {
      unwatch: async (): Promise<void> => {
        unsubscribeOnAdd()
        unsubscribeOnChange()
        unsubscribeOnRemove()
      },
    }
  }
}
