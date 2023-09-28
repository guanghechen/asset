import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import type {
  IAssetTargetDataStorage,
  IBinaryFileData,
  IFileData,
  IJsonFileData,
  IPathResolver,
  ITargetItem,
  ITargetItemWithoutData,
  ITextFileData,
} from '@guanghechen/asset-types'
import { existsSync, mkdirSync } from 'node:fs'
import { readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

interface IProps {
  rootDir: string
  pathResolver: IPathResolver
  prettier?: boolean
}

export class FileAssetTargetDataStorage implements IAssetTargetDataStorage {
  public readonly rootDir: string
  public readonly pathResolver: IPathResolver
  protected readonly _prettier: boolean

  constructor(props: IProps) {
    const { rootDir, pathResolver, prettier = true } = props
    this.rootDir = rootDir
    this.pathResolver = pathResolver
    this._prettier = prettier
  }

  public async load(uri: string, fileItem: ITargetItemWithoutData): Promise<IFileData> {
    const filepath: string = this._resolvePathFromUri(uri)
    const { datatype } = fileItem
    switch (datatype) {
      case AssetDataTypeEnum.BINARY: {
        const content: IBinaryFileData = await readFile(filepath)
        return content
      }
      case AssetDataTypeEnum.TEXT: {
        const content: ITextFileData = await readFile(filepath, fileItem.encoding)
        return content
      }
      case AssetDataTypeEnum.JSON: {
        const content: string = await readFile(filepath, 'utf8')
        const data: IJsonFileData = JSON.parse(content)
        return data
      }
      case AssetDataTypeEnum.ASSET_MAP: {
        const content: string = await readFile(filepath, 'utf8')
        const data: IJsonFileData = JSON.parse(content)
        return data
      }
      default:
        throw new TypeError(`Unexpected datatype: ${datatype}`)
    }
  }

  public async remove(uri: string): Promise<void> {
    const filepath: string = this._resolvePathFromUri(uri)
    await unlink(filepath)
  }

  public async save(uri: string, item: ITargetItem): Promise<void> {
    const filepath: string = this._resolvePathFromUri(uri)
    const dirpath: string = path.dirname(filepath)
    if (!existsSync(dirpath)) mkdirSync(dirpath, { recursive: true })

    const { datatype, data } = item
    switch (datatype) {
      case AssetDataTypeEnum.BINARY: {
        await writeFile(filepath, data)
        break
      }
      case AssetDataTypeEnum.TEXT: {
        await writeFile(filepath, data, item.encoding)
        break
      }
      case AssetDataTypeEnum.JSON: {
        const content: string = this._prettier
          ? JSON.stringify(data, null, 2)
          : JSON.stringify(data)
        await writeFile(filepath, content, 'utf8')
        break
      }
      case AssetDataTypeEnum.ASSET_MAP: {
        const content: string = this._prettier
          ? JSON.stringify(data, null, 2)
          : JSON.stringify(data)
        await writeFile(filepath, content, 'utf8')
        break
      }
      default:
        throw new TypeError(`[FileAssetTargetDataStorage.save] Unexpected datatype: ${datatype}`)
    }
  }

  public _resolvePathFromUri(uri: string): string {
    const p: string = uri.replace(/^[/\\]/, '').replace(/[?#][\s\S]+$/, '')
    return this.pathResolver.absolute(this.rootDir, p)
  }
}
