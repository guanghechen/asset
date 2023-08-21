import type { AssetChangeEvent } from './enum'

export interface IAssetChangeTaskData {
  type: AssetChangeEvent
  payload: {
    locations: string[]
  }
}
