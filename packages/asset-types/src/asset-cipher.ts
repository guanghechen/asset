import type { IBinaryFileData } from './asset-file'

export interface IAssetEncipher {
  /**
   * Encoding the given data.
   * @param data
   */
  encode(data: IBinaryFileData): Promise<IBinaryFileData>
}

export interface IAssetDecipher {
  /**
   * Decode the given data.
   * @param data
   */
  decode(data: IBinaryFileData): Promise<IBinaryFileData>
}
