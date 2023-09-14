import type { AssetChangeEventEnum } from './enum'

export interface IAssetTaskData {
  type: AssetChangeEventEnum
  alive: boolean
  srcPath: string
}
