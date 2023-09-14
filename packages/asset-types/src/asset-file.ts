import type { AssetDataTypeEnum } from './enum'

export interface IAssetStat {
  birthtime: Date
  mtime: Date
}

export interface ITextFileItem {
  datatype: AssetDataTypeEnum.TEXT
  mimetype: string
  absolutePath: string
  data: string
  encoding: BufferEncoding
  stat: IAssetStat
}

export interface IJsonFileItem {
  datatype: AssetDataTypeEnum.JSON
  mimetype: string
  absolutePath: string
  data: unknown
  encoding: undefined
  stat: IAssetStat
}

export interface IBinaryFileItem {
  datatype: AssetDataTypeEnum.BINARY
  mimetype: string
  absolutePath: string
  data: IBinaryLike
  encoding: undefined
  stat: IAssetStat
}

export type IBinaryLike = Buffer
export type IFileItem = ITextFileItem | IJsonFileItem | IBinaryFileItem
