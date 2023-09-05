import { AssetTargetStorage } from '@guanghechen/asset-storage'
import { AssetDataType, FileType } from '@guanghechen/asset-types'
import type {
  IAssetTargetStorage,
  IBinaryFileItem,
  IJsonFileItem,
  ITextFileItem,
} from '@guanghechen/asset-types'
import { existsSync } from 'node:fs'
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

export interface IFileTargetAssetStorageProps {
  rootDir: string
  caseSensitive?: boolean
  prettier?: boolean
}

export class FileTargetAssetStorage extends AssetTargetStorage implements IAssetTargetStorage {
  protected readonly _prettier: boolean

  constructor(props: IFileTargetAssetStorageProps) {
    const { rootDir, caseSensitive = true, prettier = true } = props

    super({ rootDir, caseSensitive })
    this._prettier = prettier
  }

  public async mkdirsIfNotExists(filepath: string, isDir: boolean): Promise<void> {
    const dirPath = isDir ? filepath : path.dirname(filepath)
    if (existsSync(dirPath)) return
    await mkdir(dirPath, { recursive: true })
  }

  public override async writeBinaryFile(filepath: string, content: Buffer): Promise<void> {
    const absolutePath: string = this.absolute(filepath)
    await writeFile(absolutePath, content)

    const fileStat = await stat(filepath)
    const newItem: IBinaryFileItem = {
      type: FileType.FILE,
      contentType: AssetDataType.BINARY,
      absolutePath,
      content,
      encoding: undefined,
      stat: {
        birthtime: fileStat.birthtime,
        mtime: fileStat.mtime,
      },
    }

    // Notify
    this._monitors.onBinaryFileWritten.notify(newItem)
    this._monitors.onFileWritten.notify(newItem)
  }

  public override async writeTextFile(
    filepath: string,
    content: string,
    encoding: BufferEncoding,
  ): Promise<void> {
    const absolutePath: string = this.absolute(filepath)
    await writeFile(absolutePath, content, encoding)

    const fileStat = await stat(filepath)
    const newItem: ITextFileItem = {
      type: FileType.FILE,
      contentType: AssetDataType.TEXT,
      absolutePath,
      content,
      encoding,
      stat: {
        birthtime: fileStat.birthtime,
        mtime: fileStat.mtime,
      },
    }

    // Notify
    this._monitors.onTextFileWritten.notify(newItem)
    this._monitors.onFileWritten.notify(newItem)
  }

  public override async writeJsonFile(filepath: string, content: unknown): Promise<void> {
    const absolutePath: string = this.absolute(filepath)
    const s: string = this._prettier ? JSON.stringify(content, null, 2) : JSON.stringify(content)
    await writeFile(absolutePath, s, 'utf8')

    const fileStat = await stat(filepath)
    const newItem: IJsonFileItem = {
      type: FileType.FILE,
      contentType: AssetDataType.JSON,
      absolutePath,
      content,
      encoding: undefined,
      stat: {
        birthtime: fileStat.birthtime,
        mtime: fileStat.mtime,
      },
    }

    // Notify
    this._monitors.onJsonFileWritten.notify(newItem)
    this._monitors.onFileWritten.notify(newItem)
  }

  public override async removeFile(filepath: string): Promise<void> {
    await unlink(filepath)

    // Notify
    this._monitors.onFileRemoved.notify(filepath)
  }
}
