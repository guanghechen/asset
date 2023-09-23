import type { ITargetItem } from '@guanghechen/asset-types'
import { AssetDataTypeEnum } from '@guanghechen/asset-types'

export function resolveUriFromTargetItem(item: ITargetItem): string {
  if (item.datatype === AssetDataTypeEnum.ASSET_MAP) return item.uri
  return item.asset.uri
}
