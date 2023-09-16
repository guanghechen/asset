import type { IAssetStat, IBinaryFileData, IJsonFileData, ITextFileData } from './asset-file'
import type { AssetDataTypeEnum } from './enum'

export interface IRawBinarySourceItem {
  datatype: AssetDataTypeEnum.BINARY
  filepath: string
}

export interface IRawTextSourceItem {
  datatype: AssetDataTypeEnum.TEXT
  filepath: string
  encoding: BufferEncoding
}

export interface IRawJsonSourceItem {
  datatype: AssetDataTypeEnum.JSON
  filepath: string
}

export interface IBinarySourceItem {
  datatype: AssetDataTypeEnum.BINARY
  filepath: string
  stat: IAssetStat
  data: IBinaryFileData
}

export interface ITextSourceItem {
  datatype: AssetDataTypeEnum.TEXT
  filepath: string
  stat: IAssetStat
  data: ITextFileData
  encoding: BufferEncoding
}

export interface IJsonSourceItem {
  datatype: AssetDataTypeEnum.JSON
  filepath: string
  stat: IAssetStat
  data: IJsonFileData
}

export type IRawSourceItem = IRawBinarySourceItem | IRawTextSourceItem | IRawJsonSourceItem
export type ISourceItem = IBinarySourceItem | ITextSourceItem | IJsonSourceItem
