import type { IAssetId, IAssetTagId } from './_misc'

export interface IAssetTag {
  /**
   * Unique identifier.
   */
  guid: IAssetTagId
  /**
   * Tag fingerprint.
   */
  fingerprint: string
  /**
   * Display name.
   */
  label: string
  /**
   * Unique identifier list of assets which tagged with this tag.
   */
  assets: IAssetId[]
}

export interface IAssetTagDataMap {
  entities: IAssetTag[]
}

export interface IAssetTagManager {
  fromJSON(json: Readonly<IAssetTagDataMap>): void
  toJSON(): IAssetTagDataMap
  findByGuid(guid: IAssetTagId): IAssetTag | undefined
  findByFingerprint(fingerprint: string): IAssetTag | undefined
  insert(tagLabel: string, assetId: IAssetId): IAssetTag | undefined
  remove(guid: IAssetTagId, assetId: IAssetId): void
}
