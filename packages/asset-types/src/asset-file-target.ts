import type { IAsset } from './asset'
import type { IBinaryFileData, IJsonFileData, ITextFileData } from './asset-file'
import type { AssetDataTypeEnum } from './enum'

export interface IBinaryTargetItem {
  datatype: AssetDataTypeEnum.BINARY
  asset: IAsset
  data: IBinaryFileData
}

export interface ITextTargetItem {
  datatype: AssetDataTypeEnum.TEXT
  asset: IAsset
  data: ITextFileData
  encoding: BufferEncoding
}

export interface IJsonTargetItem {
  datatype: AssetDataTypeEnum.JSON
  asset: IAsset
  data: IJsonFileData
}

export interface IAssetMapTargetItem {
  datatype: AssetDataTypeEnum.ASSET_MAP
  uri: string
  data: IJsonFileData
}

export type ITargetItem =
  | IBinaryTargetItem
  | ITextTargetItem
  | IJsonTargetItem
  | IAssetMapTargetItem

export type IBinaryTargetItemWithoutData = Omit<IBinaryTargetItem, 'data'>
export type ITextTargetItemWithoutData = Omit<ITextTargetItem, 'data'>
export type IJsonTargetItemWithoutData = Omit<IJsonTargetItem, 'data'>
export type IAssetMapTargetItemWithoutData = Omit<IAssetMapTargetItem, 'data'>
export type ITargetItemWithoutData =
  | IBinaryTargetItemWithoutData
  | ITextTargetItemWithoutData
  | IJsonTargetItemWithoutData
  | IAssetMapTargetItemWithoutData
