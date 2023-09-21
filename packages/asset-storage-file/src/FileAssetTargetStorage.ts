import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import type {
  IAssetPathResolver,
  IAssetTargetDataStorage,
  IBinaryFileData,
  IFileData,
  IJsonFileData,
  IRawTargetItem,
  ITargetItemWithoutData,
  ITextFileData,
} from '@guanghechen/asset-types'
import { existsSync, mkdirSync } from 'node:fs'
import { readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

interface IProps {
  pathResolver: IAssetPathResolver
  prettier?: boolean
}

export class FileAssetTargetDataStorage implements IAssetTargetDataStorage {
  public readonly pathResolver: IAssetPathResolver
  protected readonly _prettier: boolean

  constructor(props: IProps) {
    const { pathResolver, prettier = true } = props
    this.pathResolver = pathResolver
    this._prettier = prettier
  }

  public async load(uri: string, fileItem: ITargetItemWithoutData): Promise<IFileData> {
    const { datatype, encoding } = fileItem
    const filepath: string = this.pathResolver.resolveFromUri(uri)
    switch (datatype) {
      case AssetDataTypeEnum.BINARY: {
        const content: IBinaryFileData = await readFile(filepath)
        return content
      }
      case AssetDataTypeEnum.TEXT: {
        const content: ITextFileData = await readFile(filepath, encoding)
        return content
      }
      case AssetDataTypeEnum.JSON: {
        const content: string = await readFile(filepath, 'utf8')
        const data: IJsonFileData = JSON.parse(content)
        return data
      }
      default:
        throw new TypeError(`Unexpected datatype: ${datatype}`)
    }
  }

  public async remove(uri: string): Promise<void> {
    const filepath: string = this.pathResolver.resolveFromUri(uri)
    await unlink(filepath)
  }

  public async save(rawItem: IRawTargetItem): Promise<void> {
    const { datatype, uri, data } = rawItem
    const filepath: string = this.pathResolver.resolveFromUri(uri)
    const dirpath: string = path.dirname(filepath)
    if (!existsSync(dirpath)) mkdirSync(dirpath, { recursive: true })

    switch (datatype) {
      case AssetDataTypeEnum.BINARY: {
        await writeFile(filepath, data)
        break
      }
      case AssetDataTypeEnum.TEXT: {
        await writeFile(filepath, data, rawItem.encoding)
        break
      }
      case AssetDataTypeEnum.JSON: {
        const content: string = this._prettier
          ? JSON.stringify(data, null, 2)
          : JSON.stringify(data)
        await writeFile(filepath, content, 'utf8')
        break
      }
      default:
        throw new TypeError(`Unexpected datatype: ${datatype}`)
    }
  }
}
