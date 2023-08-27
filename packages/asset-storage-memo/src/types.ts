import type { AssetDataType, IAssetStat } from '@guanghechen/asset-types'
import type { BinaryLike } from 'node:crypto'

export enum FileType {
  FILE = 'file',
  FOLDER = 'folder',
}

export interface IFolderItem {
  type: FileType.FOLDER
  path: string
}

export interface ITextFileItem {
  type: FileType.FILE
  contentType: AssetDataType.TEXT
  path: string
  content: string
  encoding: BufferEncoding
  stat: IAssetStat
}

export interface IJsonFileItem {
  type: FileType.FILE
  contentType: AssetDataType.JSON
  path: string
  content: unknown
  encoding: undefined
  stat: IAssetStat
}

export interface IBinaryFileItem {
  type: FileType.FILE
  contentType: AssetDataType.BINARY
  path: string
  content: BinaryLike
  encoding: undefined
  stat: IAssetStat
}

export type IFileItem = ITextFileItem | IJsonFileItem | IBinaryFileItem

export interface IWatcher {
  patterns: string[]
  onAdd: (filepath: string) => void
  onChange: (filepath: string) => void
  onUnlink: (filepath: string) => void
}
