import type { IAssetStat, IBinaryFileData } from './asset-file'

export interface IRawSourceItem {
  absoluteSrcPath: string
  stat: IAssetStat
  data: IBinaryFileData
}

export interface ISourceItem {
  srcRoot: string
  absoluteSrcPath: string
  stat: IAssetStat
  data: IBinaryFileData
  encoding: BufferEncoding | undefined
}
