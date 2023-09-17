import type { IAssetStat, IBinaryFileData } from './asset-file'

export interface IRawBinarySourceItem {
  filepath: string
}

export interface IBinarySourceItem {
  filepath: string
  stat: IAssetStat
  data: IBinaryFileData
}

export type IRawSourceItem = IRawBinarySourceItem
export type ISourceItem = IBinarySourceItem
