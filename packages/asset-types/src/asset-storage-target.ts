import type { IMonitorUnsubscribe } from '@guanghechen/types'
import type {
  IAssetStat,
  IBinaryFileData,
  IFileData,
  IJsonFileData,
  ITextFileData,
} from './asset-file'
import type { IAssetPathResolver } from './asset-path-resolver'
import type { AssetDataTypeEnum } from './enum'

export interface IRawBinaryTargetItem {
  datatype: AssetDataTypeEnum.BINARY
  mimetype: string
  uri: string
  data: IBinaryFileData
}

export interface IRawTextTargetItem {
  datatype: AssetDataTypeEnum.TEXT
  mimetype: string
  uri: string
  data: ITextFileData
  encoding: BufferEncoding
}

export interface IRawJsonTargetItem {
  datatype: AssetDataTypeEnum.JSON
  mimetype: string
  uri: string
  data: IJsonFileData
}

export interface IBinaryTargetItem {
  datatype: AssetDataTypeEnum.BINARY
  mimetype: string
  absolutePath: string
  data: IBinaryFileData
  encoding: undefined
  stat: IAssetStat
}

export interface ITextTargetItem {
  datatype: AssetDataTypeEnum.TEXT
  mimetype: string
  absolutePath: string
  data: ITextFileData
  encoding: BufferEncoding
  stat: IAssetStat
}

export interface IJsonTargetItem {
  datatype: AssetDataTypeEnum.JSON
  mimetype: string
  absolutePath: string
  data: IJsonFileData
  encoding: undefined
  stat: IAssetStat
}

export type IRawTargetItem = IRawTextTargetItem | IRawJsonTargetItem | IRawBinaryTargetItem
export type ITargetItem = ITextTargetItem | IJsonTargetItem | IBinaryTargetItem

export type IBinaryTargetItemWithoutData = Omit<IBinaryTargetItem, 'data'>
export type ITextTargetItemWithoutData = Omit<ITextTargetItem, 'data'>
export type IJsonTargetItemWithoutData = Omit<IJsonTargetItem, 'data'>
export type ITargetItemWithoutData =
  | IBinaryTargetItemWithoutData
  | ITextTargetItemWithoutData
  | IJsonTargetItemWithoutData

export interface IAssetTargetStorageMonitor {
  onFileWritten(item: ITargetItem): void
  onFileRemoved(item: ITargetItem): void
}

export type IParametersOfOnFileWritten = Parameters<IAssetTargetStorageMonitor['onFileWritten']>
export type IParametersOfOnFileRemoved = Parameters<IAssetTargetStorageMonitor['onFileRemoved']>

export interface IAssetTargetDataStorage {
  readonly pathResolver: IAssetPathResolver
  save(rawItem: IRawTargetItem): Promise<void>
  remove(uri: string): Promise<void>
  load(uri: string, assetItem: ITargetItemWithoutData): Promise<IFileData | undefined>
}

export interface IAssetTargetStorage {
  readonly destroyed: boolean
  destroy(): Promise<void>
  monitor(monitor: Partial<IAssetTargetStorageMonitor>): IMonitorUnsubscribe
  removeFile(uri: string): Promise<void>
  resolveFile(uri: string): Promise<ITargetItem | undefined>
  writeFile(item: IRawTargetItem): Promise<void>
}
