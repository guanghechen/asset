import { AssetTargetStorage } from '@guanghechen/asset-storage'
import { AssetDataType, FileType } from '@guanghechen/asset-types'
import type {
  IAssetTargetStorage,
  IBinaryFileItem,
  IFileItem,
  IFolderItem,
  IJsonFileItem,
  ITextFileItem,
} from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'

export interface IMemoAssetStorageProps {
  rootDir: string
  initialData: Iterable<[string, IFileItem | IFolderItem]>
}

export class MemoAssetStorage extends AssetTargetStorage implements IAssetTargetStorage {
  protected readonly cache: Map<string, IFileItem | IFolderItem>

  constructor(props: IMemoAssetStorageProps) {
    const { rootDir, initialData } = props
    super({ rootDir })
    this.cache = new Map(initialData)
  }

  public override async mkdirsIfNotExists(filepath: string, isDir: boolean): Promise<void> {
    const dirPath = isDir ? filepath : this.dirname(filepath)
    for (let p = dirPath; p.length > 0; ) {
      const identifier = this.identity(p)
      if (this.cache.has(identifier)) break

      this.cache.set(identifier, { type: FileType.FOLDER, absolutePath: this.absolute(p) })

      const q = this.dirname(p)
      if (p === q) break
      p = q
    }
  }

  public override async writeBinaryFile(filepath: string, content: Buffer): Promise<void> {
    const identifier = this.identity(filepath)
    const item = this.cache.get(identifier)
    invariant(
      !item || (item.type === FileType.FILE && item.contentType === AssetDataType.BINARY),
      `[${this.constructor.name}.writeFile] invalid filepath: ${filepath}`,
    )

    const absolutePath: string = this.absolute(filepath)
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
    this.cache.set(identifier, newItem)

    // Notify
    this._monitors.onWrittenBinaryFile.notify(newItem)
    this._monitors.onWrittenFile.notify(newItem)
  }

  public override async writeTextFile(
    filepath: string,
    content: string,
    encoding: BufferEncoding,
  ): Promise<void> {
    const identifier = this.identity(filepath)
    const item = this.cache.get(identifier)
    invariant(
      !item || (item.type === FileType.FILE && item.contentType === AssetDataType.TEXT),
      `[${this.constructor.name}.writeFile] invalid filepath: ${filepath}`,
    )

    const absolutePath: string = this.absolute(filepath)
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
    this.cache.set(identifier, newItem)

    // Notify
    this._monitors.onWrittenTextFile.notify(newItem)
    this._monitors.onWrittenFile.notify(newItem)
  }

  public override async writeJsonFile(filepath: string, content: unknown): Promise<void> {
    const identifier = this.identity(filepath)
    const item = this.cache.get(identifier)
    invariant(
      !item || (item.type === FileType.FILE && item.contentType === AssetDataType.JSON),
      `[${this.constructor.name}.writeFile] invalid filepath: ${filepath}`,
    )

    const absolutePath: string = this.absolute(filepath)
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
    this.cache.set(identifier, newItem)

    // Notify
    this._monitors.onWrittenJsonFile.notify(newItem)
    this._monitors.onWrittenFile.notify(newItem)
  }
}
