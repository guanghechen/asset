import type { AssetDataType, FileType } from './enum'

export interface IAssetStat {
  birthtime: Date
  mtime: Date
}

export interface ITextFileItem {
  type: FileType.FILE
  contentType: AssetDataType.TEXT
  absolutePath: string
  content: string
  encoding: BufferEncoding
  stat: IAssetStat
}

export interface IJsonFileItem {
  type: FileType.FILE
  contentType: AssetDataType.JSON
  absolutePath: string
  content: unknown
  encoding: undefined
  stat: IAssetStat
}

export interface IBinaryFileItem {
  type: FileType.FILE
  contentType: AssetDataType.BINARY
  absolutePath: string
  content: IBinaryLike
  encoding: undefined
  stat: IAssetStat
}

export type IBinaryLike = Buffer
export type IFileItem = ITextFileItem | IJsonFileItem | IBinaryFileItem
export interface IFolderItem {
  type: FileType.FOLDER
  absolutePath: string
}
