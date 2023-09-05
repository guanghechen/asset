import type {
  IAssetCollectOptions,
  IAssetSourceStorage,
  IAssetStat,
  IAssetWatchOptions,
  IAssetWatcher,
} from '@guanghechen/asset-types'
import { AssetPathResolver } from './AssetPathResolver'

export interface IAssetSourceStorageProps {
  rootDir: string
  caseSensitive: boolean
}

export abstract class AssetSourceStorage extends AssetPathResolver implements IAssetSourceStorage {
  constructor(props: IAssetSourceStorageProps) {
    const { rootDir, caseSensitive } = props

    super({ rootDir, caseSensitive })
  }

  public abstract assertExistedPath(srcPath: string): Promise<void>

  public abstract assertExistedFile(srcPath: string): Promise<void>

  public abstract collectAssetSrcPaths(
    patterns: string[],
    options: IAssetCollectOptions,
  ): Promise<string[]>

  public abstract readBinaryFile(filepath: string): Promise<Buffer>

  public abstract readTextFile(filepath: string, encoding: BufferEncoding): Promise<string>

  public abstract readJsonFile(filepath: string): Promise<unknown>

  public abstract statFile(filepath: string): Promise<IAssetStat>

  public abstract watch(patterns: string[], options: IAssetWatchOptions): IAssetWatcher
}
