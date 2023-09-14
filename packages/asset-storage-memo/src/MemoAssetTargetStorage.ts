import { AssetTargetStorage } from '@guanghechen/asset-storage'
import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import type {
  IAssetPathResolver,
  IAssetTargetStorage,
  IBinaryFileItem,
  IFileItem,
  IJsonFileItem,
  ITextFileItem,
} from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'

export interface IMemoAssetTargetStorageProps {
  pathResolver: IAssetPathResolver
  initialData: Iterable<[string, IFileItem]>
}

export class MemoAssetTargetStorage extends AssetTargetStorage implements IAssetTargetStorage {
  protected readonly _cache: Map<string, IFileItem>

  constructor(props: IMemoAssetTargetStorageProps) {
    const { pathResolver, initialData } = props
    super({ pathResolver })
    this._cache = new Map(initialData)
  }

  public override async locateFileByUri(uri: string): Promise<IFileItem | undefined> {
    return this._cache.get(uri)
  }

  public override async writeBinaryFile(
    uri: string,
    mimetype: string,
    content: Buffer,
  ): Promise<void> {
    const item = this._cache.get(uri)
    invariant(
      !item || item.datatype === AssetDataTypeEnum.BINARY,
      `[MemoAssetTargetStorage.writeBinaryFile] invalid uri: ${uri}`,
    )

    const filepath: string = this._resolvePathFromUri(uri)
    const newItem: IBinaryFileItem = {
      datatype: AssetDataTypeEnum.BINARY,
      mimetype,
      absolutePath: filepath,
      data: content,
      encoding: undefined,
      stat: {
        birthtime: (item as IFileItem)?.stat?.birthtime ?? new Date(),
        mtime: new Date(),
      },
    }
    this._cache.set(uri, newItem)

    // Notify
    this._monitors.onBinaryFileWritten.notify(newItem)
    this._monitors.onFileWritten.notify(newItem)
  }

  public override async writeTextFile(
    uri: string,
    mimetype: string,
    content: string,
    encoding: BufferEncoding,
  ): Promise<void> {
    const item = this._cache.get(uri)
    invariant(
      !item || item.datatype === AssetDataTypeEnum.TEXT,
      `[MemoAssetTargetStorage.writeTextFile] invalid uri: ${uri}`,
    )

    const filepath: string = this._resolvePathFromUri(uri)
    const newItem: ITextFileItem = {
      datatype: AssetDataTypeEnum.TEXT,
      mimetype,
      absolutePath: filepath,
      data: content,
      encoding,
      stat: {
        birthtime: (item as IFileItem)?.stat?.birthtime ?? new Date(),
        mtime: new Date(),
      },
    }
    this._cache.set(uri, newItem)

    // Notify
    this._monitors.onTextFileWritten.notify(newItem)
    this._monitors.onFileWritten.notify(newItem)
  }

  public override async writeJsonFile(
    uri: string,
    mimetype: string,
    content: unknown,
  ): Promise<void> {
    const item = this._cache.get(uri)
    invariant(
      !item || item.datatype === AssetDataTypeEnum.JSON,
      `[MemoAssetTargetStorage.writeJsonFile] invalid uri: ${uri}`,
    )

    const filepath: string = this._resolvePathFromUri(uri)
    const newItem: IJsonFileItem = {
      datatype: AssetDataTypeEnum.JSON,
      mimetype,
      absolutePath: filepath,
      data: content,
      encoding: undefined,
      stat: {
        birthtime: (item as IFileItem)?.stat?.birthtime ?? new Date(),
        mtime: new Date(),
      },
    }
    this._cache.set(uri, newItem)

    // Notify
    this._monitors.onJsonFileWritten.notify(newItem)
    this._monitors.onFileWritten.notify(newItem)
  }

  public override async removeFile(uri: string): Promise<void> {
    const filepath: string = this._resolvePathFromUri(uri)
    const identifier = this.pathResolver.identify(filepath)
    this._cache.delete(identifier)

    // Notify
    this._monitors.onFileRemoved.notify(filepath)
  }
}
