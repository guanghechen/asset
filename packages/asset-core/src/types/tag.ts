import type { IAssetId, IAssetTagId } from './_misc'

export interface IAssetTag {
  /**
   * Unique identifier.
   */
  guid: IAssetTagId
  /**
   * Tag identifier
   */
  identifier: string
  /**
   * Display name.
   */
  label: string
  /**
   * Unique identifier list of assets which tagged with this tag.
   */
  assets: IAssetId[]
}

export interface IAssetTagMap {
  entities: IAssetTag[]
}

export interface IAssetTagManager {
  dump(): IAssetTagMap
  findByGuid(guid: IAssetTagId): IAssetTag | undefined
  findByIdentifier(identifier: string): IAssetTag | undefined
  insert(tagLabel: string, assetId: IAssetId): IAssetTag
  remove(guid: IAssetTagId, assetId: IAssetId): void
}
