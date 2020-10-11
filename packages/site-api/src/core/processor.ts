import type { AssetDataItem, RoughAssetDataItem } from './entity/asset'
import type { CategoryDataItem } from './entity/category'
import type { TagDataItem } from './entity/tag'
import type { ImmutableAssetDataManager } from './manager/asset'
import type { ImmutableCategoryDataManager } from './manager/category'
import type { ImmutableTagDataManager } from './manager/tag'


/**
 * Process asset source file
 */
export interface AssetProcessor {
  /**
   * Check whether the processor can handle this file
   *
   * @param filepath
   */
  processable(filepath: string): boolean

  /**
   * Process source file to AssetEntity
   *
   * @param filename            file path of the asset
   * @param rawContent          raw content of the asset (Buffer)
   * @param roughAsset          rough AssetDataItem
   * @param tagDataManager      instance of TagDataManager only includes immutable methods
   * @param categoryDataManager instance of CategoryDataManager only includes immutable methods
   * @param assetDataManager    instance of AssetDataManager only includes immutable methods
   */
  process(
    filepath: string,
    rawContent: Buffer,
    roughAsset: RoughAssetDataItem,
    tagDataManager: ImmutableTagDataManager,
    categoryDataManager: ImmutableCategoryDataManager,
    assetDataManager: ImmutableAssetDataManager,
  ): [AssetDataItem, TagDataItem[], CategoryDataItem[][]]
}
