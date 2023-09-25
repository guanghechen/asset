import type { IAssetStat, IBinaryFileData } from './asset-file'

export interface IRawSourceItem {
  filepath: string
  stat: IAssetStat
  data: IBinaryFileData
}

export interface ISourceItem {
  filepath: string
  stat: IAssetStat
  data: IBinaryFileData
  encoding: BufferEncoding | undefined
}
