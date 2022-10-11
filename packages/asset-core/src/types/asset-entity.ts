import type { IAsset } from './asset'

export enum AssetDataType {
  /**
   * Binary data.
   */
  BINARY = 'binary',
  /**
   * JSON Object.
   */
  JSON = 'json',
  /**
   * LITERAL text.
   */
  TEXT = 'string',
}

export interface IAssetEntity extends IAsset {
  /**
   * Source virtual filepath (*nix style).
   */
  src: string
  /**
   * Asset data
   */
  data: unknown | null
}
