import invariant from '@guanghechen/invariant'
import type { IAssetId } from '../types/_misc'
import type { IAsset, IAssetDataMap, IAssetManager, IRawAsset } from '../types/asset'
import type { IAssetCategoryManager } from '../types/category'
import type { IAssetTagManager } from '../types/tag'
import { list2map, uniqueStrings } from '../util/misc'
import { AssetCategoryManager } from './category'
import { AssetTagManager } from './tag'

export interface IAssetManagerProps {
  tagManager?: IAssetTagManager
  categoryManager?: IAssetCategoryManager
}

export class AssetManager implements IAssetManager {
  protected readonly guidMap: Map<IAssetId, IAsset> = new Map()
  protected readonly tagManager: IAssetTagManager
  protected readonly categoryManager: IAssetCategoryManager

  constructor(props: IAssetManagerProps) {
    this.tagManager = props.tagManager ?? new AssetTagManager()
    this.categoryManager = props.categoryManager ?? new AssetCategoryManager()
  }

  public fromJSON(json: Readonly<IAssetDataMap>): void {
    this.tagManager.fromJSON({ tags: json.tags })
    this.categoryManager.fromJSON({ categories: json.categories })
    list2map(
      json.assets,
      entity => entity.guid,
      entity => entity,
      this.guidMap,
    )
  }

  public toJSON(): IAssetDataMap {
    const { tags } = this.tagManager.toJSON()
    const { categories } = this.categoryManager.toJSON()
    const assets: IAsset[] = Array.from(this.guidMap.values())
    return { tags, categories, assets }
  }

  public findByGuid(guid: string): IAsset | undefined {
    return this.guidMap.get(guid)
  }

  public insert(rawAsset: IRawAsset): IAsset | undefined {
    invariant(!this.guidMap.has(rawAsset.guid), () => {
      const details = JSON.stringify(rawAsset)
      return `[AssetManager.insert] asset is exists. ${details}`
    })

    const asset: IAsset = {
      guid: rawAsset.guid,
      fingerprint: rawAsset.fingerprint,
      type: rawAsset.type,
      createdAt: rawAsset.createdAt,
      updatedAt: rawAsset.updatedAt,
      categories: uniqueStrings(
        rawAsset.categories.map(
          category => this.categoryManager.insert(category.join('/'), rawAsset.guid)?.guid,
        ),
      ),
      tags: uniqueStrings(
        rawAsset.tags.map(tag => this.tagManager.insert(tag, rawAsset.guid)?.guid),
      ),
      title: rawAsset.title,
    }
    this.guidMap.set(asset.guid, asset)
    return asset
  }

  public remove(guid: string): void {
    const asset = this.findByGuid(guid)
    if (asset) {
      asset.categories.forEach(category => this.categoryManager.remove(category, asset.guid))
      asset.tags.forEach(tags => this.tagManager.remove(tags, asset.guid))
      this.guidMap.delete(guid)
    }
    throw new Error('Method not implemented.')
  }
}
