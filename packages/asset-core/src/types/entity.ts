import type { IAssetId } from './_misc'

export interface IAssetEntity<D> {
  /**
   * Global unique identifier.
   */
  guid: IAssetId
  /**
   * Type of asset.
   */
  type: string
  /**
   * The hash value of the contents.
   */
  fingerprint: string
  /**
   * The created date of the asset (ISOString).
   */
  createdAt: string
  /**
   * The last modification date of the asset (ISOString).
   */
  updatedAt: string
  /**
   * Title of asset.
   */
  title: string
  /**
   * Asset data.
   */
  data: D
}
