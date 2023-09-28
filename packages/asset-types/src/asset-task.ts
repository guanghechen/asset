import type { AssetChangeEventEnum } from './enum'

export interface IAssetTaskData {
  type: AssetChangeEventEnum
  absoluteSrcPaths: ReadonlyArray<string> // source filepaths.
}
