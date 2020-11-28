import type { AssetDataItem } from '@guanghechen/site-api'


export const FileAssetType = 'file'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type FileAssetType = typeof FileAssetType


/**
 * File data
 */
export interface FileAssetDataItem extends AssetDataItem {

}
