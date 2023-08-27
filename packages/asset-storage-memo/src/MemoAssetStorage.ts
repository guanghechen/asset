import { AssetDataType, type IAssetTargetStorage } from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import { MemoAssetPathResolver } from './MemoAssetPathResolver'
import { FileType } from './types'
import type { IBinaryFileItem, IFileItem, IFolderItem, IJsonFileItem, ITextFileItem } from './types'

export interface IMemoAssetStorageProps {
  rootDir: string
  initialData: Iterable<[string, IFileItem | IFolderItem]>
  onWriteFile?: (item: IFileItem | IFolderItem, storage: IAssetTargetStorage) => void
}

export class MemoAssetStorage extends MemoAssetPathResolver implements IAssetTargetStorage {
  protected readonly cache: Map<string, IFileItem | IFolderItem>
  protected readonly onWriteFile?: (item: IFileItem, storage: IAssetTargetStorage) => void

  constructor(props: IMemoAssetStorageProps) {
    const { rootDir, initialData } = props
    super({ rootDir })
    this.cache = new Map(initialData)
    this.onWriteFile = props.onWriteFile
  }

  public async clear(): Promise<void> {
    this.cache.clear()
  }

  public async mkdirsIfNotExists(filepath: string, isDir: boolean): Promise<void> {
    const dirPath = isDir ? filepath : this.dirname(filepath)
    for (let p = dirPath; p.length > 0; ) {
      const identifier = this.identity(p)
      if (this.cache.has(identifier)) break

      this.cache.set(identifier, { type: FileType.FOLDER, path: p })

      const q = this.dirname(p)
      if (p === q) break
      p = q
    }
  }

  public async writeBinaryFile(filepath: string, content: Buffer): Promise<void> {
    const identifier = this.identity(filepath)
    const item = this.cache.get(identifier)
    invariant(
      !item || (item.type === FileType.FILE && item.contentType === AssetDataType.BINARY),
      `[${this.constructor.name}.writeFile] invalid filepath: ${filepath}`,
    )

    const newItem: IBinaryFileItem = {
      type: FileType.FILE,
      contentType: AssetDataType.BINARY,
      path: filepath,
      content,
      encoding: undefined,
      stat: {
        birthtime: (item as IFileItem)?.stat?.birthtime ?? new Date(),
        mtime: new Date(),
      },
    }

    await this.mkdirsIfNotExists(filepath, false)
    this.cache.set(identifier, newItem)
    this.onWriteFile?.(newItem, this)
  }

  public async writeTextFile(
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

    const newItem: ITextFileItem = {
      type: FileType.FILE,
      contentType: AssetDataType.TEXT,
      path: filepath,
      content,
      encoding,
      stat: {
        birthtime: (item as IFileItem)?.stat?.birthtime ?? new Date(),
        mtime: new Date(),
      },
    }

    await this.mkdirsIfNotExists(filepath, false)
    this.cache.set(identifier, newItem)
    this.onWriteFile?.(newItem, this)
  }

  public async writeJsonFile(filepath: string, content: unknown): Promise<void> {
    const identifier = this.identity(filepath)
    const item = this.cache.get(identifier)
    invariant(
      !item || (item.type === FileType.FILE && item.contentType === AssetDataType.JSON),
      `[${this.constructor.name}.writeFile] invalid filepath: ${filepath}`,
    )

    const newItem: IJsonFileItem = {
      type: FileType.FILE,
      contentType: AssetDataType.JSON,
      path: filepath,
      content,
      encoding: undefined,
      stat: {
        birthtime: (item as IFileItem)?.stat?.birthtime ?? new Date(),
        mtime: new Date(),
      },
    }

    await this.mkdirsIfNotExists(filepath, false)
    this.cache.set(identifier, newItem)
    this.onWriteFile?.(newItem, this)
  }
}
