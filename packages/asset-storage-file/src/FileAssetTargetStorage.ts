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
import { existsSync } from 'node:fs'
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

type ICacheBinaryItem = Omit<IBinaryFileItem, 'data'>
type ICacheTextItem = Omit<ITextFileItem, 'data'>
type ICacheJsonItem = Omit<IJsonFileItem, 'data'>
type ICacheItem = ICacheBinaryItem | ICacheTextItem | ICacheJsonItem

export interface IFileAssetTargetStorageProps {
  pathResolver: IAssetPathResolver
  prettier?: boolean
}

export class FileAssetTargetStorage extends AssetTargetStorage implements IAssetTargetStorage {
  protected readonly _prettier: boolean
  protected readonly _cache: Map<string, ICacheItem>

  constructor(props: IFileAssetTargetStorageProps) {
    const { pathResolver, prettier = true } = props

    super({ pathResolver })
    this._prettier = prettier
    this._cache = new Map()
  }

  public override async locateFileByUri(uri: string): Promise<IFileItem | undefined> {
    const item: ICacheItem | undefined = this._cache.get(uri)
    if (item === undefined) return undefined

    const filepath: string = this._resolvePathFromUri(uri)
    switch (item.datatype) {
      case AssetDataTypeEnum.BINARY: {
        const content = await readFile(filepath)
        const result: IBinaryFileItem = { ...item, data: content }
        return result
      }
      case AssetDataTypeEnum.TEXT: {
        const content: string = await readFile(filepath, item.encoding)
        const result: ITextFileItem = { ...item, data: content }
        return result
      }
      case AssetDataTypeEnum.JSON: {
        const content: string = await readFile(filepath, 'utf8')
        const data: unknown = JSON.parse(content)
        const result: IJsonFileItem = { ...item, data }
        return result
      }
      default:
        throw new TypeError(`Unexpected datatype: ${(item as any).datatype}`)
    }
  }

  public override async writeBinaryFile(
    uri: string,
    mimetype: string,
    content: Buffer,
  ): Promise<void> {
    const filepath: string = this._resolvePathFromUri(uri)
    await this._mkdirsIfNotExists(filepath, false)
    await writeFile(filepath, content)

    const fileStat = await stat(filepath)
    const newItem: ICacheBinaryItem = {
      datatype: AssetDataTypeEnum.BINARY,
      mimetype,
      absolutePath: filepath,
      encoding: undefined,
      stat: {
        birthtime: fileStat.birthtime,
        mtime: fileStat.mtime,
      },
    }
    this._cache.set(uri, newItem)

    // Notify
    this._monitors.onBinaryFileWritten.notify({ ...newItem, data: content })
    this._monitors.onFileWritten.notify({ ...newItem, data: content })
  }

  public override async writeTextFile(
    uri: string,
    mimetype: string,
    content: string,
    encoding: BufferEncoding,
  ): Promise<void> {
    const filepath: string = this._resolvePathFromUri(uri)
    await this._mkdirsIfNotExists(filepath, false)
    await writeFile(filepath, content, encoding)

    const fileStat = await stat(filepath)
    const newItem: ICacheTextItem = {
      datatype: AssetDataTypeEnum.TEXT,
      mimetype,
      absolutePath: filepath,
      encoding,
      stat: {
        birthtime: fileStat.birthtime,
        mtime: fileStat.mtime,
      },
    }
    this._cache.set(uri, newItem)

    // Notify
    this._monitors.onTextFileWritten.notify({ ...newItem, data: content })
    this._monitors.onFileWritten.notify({ ...newItem, data: content })
  }

  public override async writeJsonFile(
    uri: string,
    mimetype: string,
    content: unknown,
  ): Promise<void> {
    const filepath: string = this._resolvePathFromUri(uri)
    await this._mkdirsIfNotExists(filepath, false)
    await writeFile(
      filepath,
      this._prettier ? JSON.stringify(content, null, 2) : JSON.stringify(content),
      'utf8',
    )

    const fileStat = await stat(filepath)
    const newItem: ICacheJsonItem = {
      datatype: AssetDataTypeEnum.JSON,
      mimetype,
      absolutePath: filepath,
      encoding: undefined,
      stat: {
        birthtime: fileStat.birthtime,
        mtime: fileStat.mtime,
      },
    }
    this._cache.set(uri, newItem)

    // Notify
    this._monitors.onJsonFileWritten.notify({ ...newItem, data: content })
    this._monitors.onFileWritten.notify({ ...newItem, data: content })
  }

  public override async removeFile(uri: string): Promise<void> {
    const filepath: string = this._resolvePathFromUri(uri)
    await unlink(filepath)

    // Notify
    this._monitors.onFileRemoved.notify(filepath)
  }

  protected async _mkdirsIfNotExists(filepath: string, isDir: boolean): Promise<void> {
    const dirPath = isDir ? filepath : path.dirname(filepath)
    if (existsSync(dirPath)) return
    await mkdir(dirPath, { recursive: true })
  }
}
