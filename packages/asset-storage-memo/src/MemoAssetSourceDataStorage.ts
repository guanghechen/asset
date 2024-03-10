import type {
  IAssetPathResolver,
  IMemoAssetSourceDataStorage,
  ISourceItem,
} from '@guanghechen/asset-types'

export interface IMemoAssetSourceStorageDataProps {
  pathResolver: IAssetPathResolver
  initialData?: Iterable<[string, ISourceItem]>
}

export class MemoAssetSourceDataStorage implements IMemoAssetSourceDataStorage {
  protected readonly _pathResolver: IAssetPathResolver
  protected readonly _cache: Map<string, ISourceItem>

  constructor(props: IMemoAssetSourceStorageDataProps) {
    const { initialData, pathResolver } = props
    this._pathResolver = pathResolver
    this._cache = new Map<string, ISourceItem>(initialData)
  }

  public has(absoluteSrcPath: string): boolean {
    const identifier: string = this._pathResolver.identify(absoluteSrcPath)
    return this._cache.has(identifier)
  }

  public get(absoluteSrcPath: string): ISourceItem | undefined {
    const identifier: string = this._pathResolver.identify(absoluteSrcPath)
    return this._cache.get(identifier)
  }

  public set(absoluteSrcPath: string, item: ISourceItem): void {
    const identifier: string = this._pathResolver.identify(absoluteSrcPath)
    this._cache.set(identifier, item)
  }

  public delete(absoluteSrcPath: string): void {
    const identifier: string = this._pathResolver.identify(absoluteSrcPath)
    this._cache.delete(identifier)
  }

  public values(): Iterable<ISourceItem> {
    return this._cache.values()
  }

  public async loadOnDemand(_absoluteFilepath: string): Promise<ISourceItem | undefined> {
    return undefined
  }
}
