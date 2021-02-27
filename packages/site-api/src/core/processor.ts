import type { AssetDataItem, RoughAssetDataItem } from './entity/asset'
import type { CategoryDataItem } from './entity/category'
import type { TagDataItem } from './entity/tag'
import type { ImmutableAssetDataManager } from './manager/asset'
import type { ImmutableCategoryDataManager } from './manager/category'
import type { ImmutableTagDataManager } from './manager/tag'
import { AssetType } from './entity/_types'

export interface AssetTypeItem {
  /**
   * Asset type
   */
  type: AssetType
  /**
   * Root filepath of the type asset
   */
  assetDataRoot: string
}


/**
 * Process asset source file
 */
export interface AssetProcessor<A extends AssetDataItem = AssetDataItem> {
  /**
   * Supported asset types
   */
  types?: () => AssetTypeItem[]

  /**
   * Check whether the processor can handle this file
   *
   * @param filepath
   */
  processable(filepath: string): boolean

  /**
   * Process source file to AssetEntity
   *
   *  - yield {[asset, tags, categories]}
   *  - return {Promise<void>|void} (post processing)
   *  - can be passed in A
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
  ): Generator<[A, TagDataItem[], CategoryDataItem[][]], Promise<void> | void, A>
}
