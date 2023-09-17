import type { IAssetStat, IBinaryFileData } from './asset-file'

export interface IBinarySourceItem {
  filepath: string
  stat: IAssetStat
  data: IBinaryFileData
}

export type ISourceItem = IBinarySourceItem
