import type {
  IAssetPathResolver,
  IAssetTargetDataStorage,
  IFileData,
  IRawTargetItem,
} from '@guanghechen/asset-types'

interface IProps {
  pathResolver: IAssetPathResolver
}

export class MemoAssetTargetDataStore implements IAssetTargetDataStorage {
  public readonly pathResolver: IAssetPathResolver
  protected _dataCache: Map<string, IFileData>

  constructor(props: IProps) {
    this.pathResolver = props.pathResolver
    this._dataCache = new Map()
  }

  public async load(uri: string): Promise<IFileData | undefined> {
    return this._dataCache.get(uri)
  }

  public async remove(uri: string): Promise<void> {
    this._dataCache.delete(uri)
  }

  public async save(rawItem: IRawTargetItem): Promise<void> {
    this._dataCache.set(rawItem.uri, rawItem.data)
  }
}
