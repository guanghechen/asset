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
  public readonly pathResolver: IAssetPathResolver
  protected readonly _cache: Map<string, ISourceItem>

  constructor(props: IMemoAssetSourceStorageDataProps) {
    const { pathResolver, initialData } = props
    this.pathResolver = pathResolver
    this._cache = new Map(initialData)
  }

  public has(srcPath: string): boolean {
    const identifier: string = this.pathResolver.identify(srcPath)
    return this._cache.has(identifier)
  }

  public get(srcPath: string): ISourceItem | undefined {
    const identifier: string = this.pathResolver.identify(srcPath)
    return this._cache.get(identifier)
  }

  public set(srcPath: string, item: ISourceItem): void {
    const identifier: string = this.pathResolver.identify(srcPath)
    this._cache.set(identifier, item)
  }

  public delete(srcPath: string): void {
    const identifier: string = this.pathResolver.identify(srcPath)
    this._cache.delete(identifier)
  }

  public values(): Iterable<ISourceItem> {
    return this._cache.values()
  }

  public async loadOnDemand(srcPath_: string): Promise<ISourceItem | undefined> {
    return undefined
  }
}
