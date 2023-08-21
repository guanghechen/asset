import type { IAssetTargetStorage, IBinaryLike } from '@guanghechen/asset-types'
import { MemoAssetPathResolver } from './MemoAssetPathResolver'
import { FileType } from './types'
import type { IFileFileItem, IFileItem } from './types'

export interface IMemoAssetStorageProps {
  rootDir: string
  initialData: Iterable<[string, IFileItem]>
  onWriteFile?: (item: IFileItem, storage: IAssetTargetStorage) => void
}

export class MemoAssetStorage extends MemoAssetPathResolver implements IAssetTargetStorage {
  protected readonly cache: Map<string, IFileItem>
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

  public async writeFile(
    filepath: string,
    content: string | IBinaryLike,
    encoding?: BufferEncoding,
  ): Promise<void> {
    const identifier = this.identity(filepath)
    const item = this.cache.get(identifier)
    const newItem = {
      type: FileType.FILE,
      path: filepath,
      content: typeof content === 'string' ? Buffer.from(content, encoding) : content,
      encoding,
      stat: {
        birthtime: (item as IFileFileItem)?.stat?.birthtime ?? new Date(),
        mtime: new Date(),
      },
    }

    await this.mkdirsIfNotExists(filepath, false)
    this.cache.set(identifier, newItem)
    this.onWriteFile?.(newItem, this)
  }
}
