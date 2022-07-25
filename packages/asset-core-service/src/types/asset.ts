import type { IAsset } from '@guanghechen/asset-core'

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
