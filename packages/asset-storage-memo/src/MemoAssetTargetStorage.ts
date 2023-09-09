import { AssetTargetStorage } from '@guanghechen/asset-storage'
import { AssetDataType, FileType } from '@guanghechen/asset-types'
import type {
  IAssetPathResolver,
  IAssetTargetStorage,
  IBinaryFileItem,
  IFileItem,
  IFolderItem,
  IJsonFileItem,
  ITextFileItem,
} from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import path from 'node:path'

export interface IMemoAssetTargetStorageProps {
  pathResolver: IAssetPathResolver
  initialData: Iterable<[string, IFileItem | IFolderItem]>
}

export class MemoAssetTargetStorage extends AssetTargetStorage implements IAssetTargetStorage {
  protected readonly _cache: Map<string, IFileItem | IFolderItem>

  constructor(props: IMemoAssetTargetStorageProps) {
    const { pathResolver, initialData } = props
    super({ pathResolver })
    this._cache = new Map(initialData)
  }

  public override async mkdirsIfNotExists(filepath: string, isDir: boolean): Promise<void> {
    const dirPath = isDir ? filepath : path.dirname(filepath)
    for (let p = dirPath; p.length > 0; ) {
      const identifier = this.pathResolver.identify(p)
      if (this._cache.has(identifier)) break

      this._cache.set(identifier, {
        type: FileType.FOLDER,
        absolutePath: this.pathResolver.absolute(p),
      })

      const q = path.dirname(p)
      if (p === q) break
      p = q
    }
  }

  public override async writeBinaryFile(filepath: string, content: Buffer): Promise<void> {
    const identifier = this.pathResolver.identify(filepath)
    const item = this._cache.get(identifier)
    invariant(
      !item || (item.type === FileType.FILE && item.contentType === AssetDataType.BINARY),
      `[${this.constructor.name}.writeBinaryFile] invalid filepath: ${filepath}`,
    )

    const absolutePath: string = this.pathResolver.absolute(filepath)
    await this.mkdirsIfNotExists(absolutePath, false)

    const newItem: IBinaryFileItem = {
      type: FileType.FILE,
      contentType: AssetDataType.BINARY,
      absolutePath,
      content,
      encoding: undefined,
      stat: {
        birthtime: (item as IFileItem)?.stat?.birthtime ?? new Date(),
        mtime: new Date(),
      },
    }
    this._cache.set(identifier, newItem)

    // Notify
    this._monitors.onBinaryFileWritten.notify(newItem)
    this._monitors.onFileWritten.notify(newItem)
  }

  public override async writeTextFile(
    filepath: string,
    content: string,
    encoding: BufferEncoding,
  ): Promise<void> {
    const identifier = this.pathResolver.identify(filepath)
    const item = this._cache.get(identifier)
    invariant(
      !item || (item.type === FileType.FILE && item.contentType === AssetDataType.TEXT),
      `[${this.constructor.name}.writeTextFile] invalid filepath: ${filepath}`,
    )

    const absolutePath: string = this.pathResolver.absolute(filepath)
    await this.mkdirsIfNotExists(absolutePath, false)

    const newItem: ITextFileItem = {
      type: FileType.FILE,
      contentType: AssetDataType.TEXT,
      absolutePath,
      content,
      encoding,
      stat: {
        birthtime: (item as IFileItem)?.stat?.birthtime ?? new Date(),
        mtime: new Date(),
      },
    }
    this._cache.set(identifier, newItem)

    // Notify
    this._monitors.onTextFileWritten.notify(newItem)
    this._monitors.onFileWritten.notify(newItem)
  }

  public override async writeJsonFile(filepath: string, content: unknown): Promise<void> {
    const identifier = this.pathResolver.identify(filepath)
    const item = this._cache.get(identifier)
    invariant(
      !item || (item.type === FileType.FILE && item.contentType === AssetDataType.JSON),
      `[${this.constructor.name}.writeJsonFile] invalid filepath: ${filepath}`,
    )

    const absolutePath: string = this.pathResolver.absolute(filepath)
    await this.mkdirsIfNotExists(absolutePath, false)

    const newItem: IJsonFileItem = {
      type: FileType.FILE,
      contentType: AssetDataType.JSON,
      absolutePath,
      content,
      encoding: undefined,
      stat: {
        birthtime: (item as IFileItem)?.stat?.birthtime ?? new Date(),
        mtime: new Date(),
      },
    }
    this._cache.set(identifier, newItem)

    // Notify
    this._monitors.onJsonFileWritten.notify(newItem)
    this._monitors.onFileWritten.notify(newItem)
  }

  public override async removeFile(filepath: string): Promise<void> {
    const identifier = this.pathResolver.identify(filepath)
    this._cache.delete(identifier)

    // Notify
    this._monitors.onFileRemoved.notify(filepath)
  }
}
