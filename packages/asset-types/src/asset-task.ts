import type { AssetChangeEvent } from './enum'

export interface IAssetTaskData {
  type: AssetChangeEvent
  alive: boolean
  payload: {
    location: string
  }
}