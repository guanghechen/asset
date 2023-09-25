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
} from '@guanghechen/asset-types'

export interface IAssetSourceStorageProps {
  pathResolver: IAssetPathResolver
  encodingDetector: IEncodingDetector
}

export abstract class AssetSourceStorage implements IAssetSourceStorage {
  public readonly pathResolver: IAssetPathResolver
  protected readonly _encodingDetector: IEncodingDetector

  constructor(props: IAssetSourceStorageProps) {
    this.pathResolver = props.pathResolver
    this._encodingDetector = props.encodingDetector
  }

  public abstract assertExistedFile(srcPath: string): Promise<void>

  public abstract collect(
    patterns: ReadonlyArray<string>,
    options: IAssetCollectOptions,
  ): Promise<string[]>

  public async detectEncoding(srcPath: string): Promise<BufferEncoding | undefined> {
    const loadData = (): Promise<IBinaryFileData> => this.readFile(srcPath)
    const encoding: BufferEncoding | undefined = await this._encodingDetector.detect(
      srcPath,
      loadData,
    )
    return encoding
  }

  public abstract readFile(srcPath: string): Promise<IBinaryFileData>

  public abstract removeFile(srcPath: string): Promise<void>

  public abstract statFile(srcPath: string): Promise<IAssetStat>

  public abstract updateFile(srcPath: string, data: IBinaryFileData): Promise<void>

  public abstract watch(patterns: ReadonlyArray<string>, options: IAssetWatchOptions): IAssetWatcher
}
