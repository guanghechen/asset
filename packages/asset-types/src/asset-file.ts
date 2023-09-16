import type { AssetDataTypeEnum } from './enum'

export interface IAssetStat {
  birthtime: Date
  mtime: Date
}

export interface IRawBinaryFileItem {
  datatype: AssetDataTypeEnum.BINARY
  mimetype: string
  uri: string
  data: IBinaryFileData
}

export interface IRawTextFileItem {
  datatype: AssetDataTypeEnum.TEXT
  mimetype: string
  uri: string
  data: ITextFileData
  encoding: BufferEncoding
}

export interface IRawJsonFileItem {
  datatype: AssetDataTypeEnum.JSON
  mimetype: string
  uri: string
  data: IJsonFileData
}

export interface IBinaryFileItem {
  datatype: AssetDataTypeEnum.BINARY
  mimetype: string
  absolutePath: string
  data: IBinaryFileData
  encoding: undefined
  stat: IAssetStat
}

export interface ITextFileItem {
  datatype: AssetDataTypeEnum.TEXT
  mimetype: string
  absolutePath: string
  data: ITextFileData
  encoding: BufferEncoding
  stat: IAssetStat
}

export interface IJsonFileItem {
  datatype: AssetDataTypeEnum.JSON
  mimetype: string
  absolutePath: string
  data: IJsonFileData
  encoding: undefined
  stat: IAssetStat
}

export type ITextFileData = string
export type IBinaryFileData = Buffer
export type IJsonFileData = object | string | boolean | number | null
export type IFileData = ITextFileData | IBinaryFileData | IJsonFileData

export type IRawFileItem = IRawTextFileItem | IRawJsonFileItem | IRawBinaryFileItem
export type IFileItem = ITextFileItem | IJsonFileItem | IBinaryFileItem

export type IAssetBinaryFileItem = Omit<IBinaryFileItem, 'data'>
export type IAssetTextFileItem = Omit<ITextFileItem, 'data'>
export type IAssetJsonFileItem = Omit<IJsonFileItem, 'data'>
export type IAssetFileItem = IAssetBinaryFileItem | IAssetTextFileItem | IAssetJsonFileItem
