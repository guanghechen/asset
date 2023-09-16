import type { AssetChangeEventEnum } from './enum'

export interface IAssetTaskData {
  type: AssetChangeEventEnum
  filepaths: string[] // source filepaths.
}
