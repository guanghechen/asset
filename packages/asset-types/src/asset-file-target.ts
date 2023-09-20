import type { IAssetStat, IBinaryFileData, IJsonFileData, ITextFileData } from './asset-file'
import type { AssetDataTypeEnum } from './enum'

export interface IRawBinaryTargetItem {
  datatype: AssetDataTypeEnum.BINARY
  mimetype: string
  sourcetype: string // markdown / file / image
  uri: string
  data: IBinaryFileData
}

export interface IRawTextTargetItem {
  datatype: AssetDataTypeEnum.TEXT
  mimetype: string
  sourcetype: string // markdown / file / image
  uri: string
  data: ITextFileData
  encoding: BufferEncoding
}

export interface IRawJsonTargetItem {
  datatype: AssetDataTypeEnum.JSON
  mimetype: string
  sourcetype: string // markdown / file / image
  uri: string
  data: IJsonFileData
}

export interface IBinaryTargetItem {
  datatype: AssetDataTypeEnum.BINARY
  mimetype: string
  sourcetype: string // markdown / file / image
  uri: string
  data: IBinaryFileData
  encoding: undefined
  stat: IAssetStat
}

export interface ITextTargetItem {
  datatype: AssetDataTypeEnum.TEXT
  mimetype: string
  sourcetype: string // markdown / file / image
  uri: string
  data: ITextFileData
  encoding: BufferEncoding
  stat: IAssetStat
}

export interface IJsonTargetItem {
  datatype: AssetDataTypeEnum.JSON
  mimetype: string
  sourcetype: string // markdown / file / image
  uri: string
  data: IJsonFileData
  encoding: undefined
  stat: IAssetStat
}

export type IRawTargetItem = IRawBinaryTargetItem | IRawTextTargetItem | IRawJsonTargetItem
export type ITargetItem = IBinaryTargetItem | ITextTargetItem | IJsonTargetItem

export type IBinaryTargetItemWithoutData = Omit<IBinaryTargetItem, 'data'>
export type ITextTargetItemWithoutData = Omit<ITextTargetItem, 'data'>
export type IJsonTargetItemWithoutData = Omit<IJsonTargetItem, 'data'>
export type ITargetItemWithoutData =
  | IBinaryTargetItemWithoutData
  | ITextTargetItemWithoutData
  | IJsonTargetItemWithoutData
