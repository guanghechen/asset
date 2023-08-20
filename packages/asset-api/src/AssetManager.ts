import type { IAsset, IAssetDataMap, IAssetManager } from '@guanghechen/asset-types'

export interface IAssetManagerProps {
  normalizeTag?(tag: string): string
  normalizeCategory?(categoryPath: string[]): string
}

const defaultAssetManagerProps: Required<IAssetManagerProps> = (() => {
  const regex = /[\s\\/]+/g
  const normalize = (text: string): string => text.trim().replace(regex, '_').toLowerCase()
  return {
    normalizeTag: normalize,
    normalizeCategory: categoryPath =>
      categoryPath
        .map(normalize)
        .filter(x => !!x)
        .join('/'),
  }
})()

export class AssetManager implements IAssetManager {
  protected readonly assetMap: Map<string, IAsset> = new Map()
  protected readonly categoryMap: Map<string, Set<string>> = new Map()
  protected readonly tagMap: Map<string, Set<string>> = new Map()
  protected readonly normalizeCategory: (categoryPath: string[]) => string
  protected readonly normalizeTag: (tag: string) => string

  constructor(props: IAssetManagerProps = {}) {
    const {
      normalizeCategory = defaultAssetManagerProps.normalizeCategory,
      normalizeTag = defaultAssetManagerProps.normalizeTag,
    } = props ?? {}

    this.normalizeCategory = normalizeCategory
    this.normalizeTag = normalizeTag
  }

  public load(json: Readonly<IAssetDataMap>, replace: boolean): void {
    if (replace) {
      this.assetMap.clear()
      this.categoryMap.clear()
      this.tagMap.clear()
    }
    json.assets.forEach(asset => this.insert(asset))
  }

  public dump(): IAssetDataMap {
    return {
      assets: Array.from(this.assetMap.values()).sort((x, y) => x.uri.localeCompare(y.uri)),
    }
  }

  public getByGuid(guid: string): IAsset | undefined {
    return this.assetMap.get(guid)
  }

  public getByTag(tag: string): IAsset[] {
    const tagId = this.normalizeTag(tag)
    const assetIds = this.tagMap.get(tagId)
    return this._getAssets(assetIds)
  }

  public getByCategory(categoryPath: string[]): IAsset[] {
    const categoryId = this.normalizeCategory(categoryPath)
    const assetIds = this.categoryMap.get(categoryId)
    return this._getAssets(assetIds)
  }

  public insert(asset: IAsset): void {
    if (this.assetMap.has(asset.guid)) {
      console.error(`[AssetManager.insert] Duplicated asset: guid(${asset.guid})`)
      return
    }

    const { assetMap, categoryMap, tagMap, normalizeTag, normalizeCategory } = this
    assetMap.set(asset.guid, asset)

    for (const categoryPath of asset.categories) {
      const categoryId = normalizeCategory(categoryPath)
      const assetIds: Set<string> = categoryMap.get(categoryId) ?? new Set<string>()
      assetIds.add(asset.guid)
      categoryMap.set(categoryId, assetIds)
    }

    for (const tag of asset.tags) {
      const tagId = normalizeTag(tag)
      const assetIds: Set<string> = tagMap.get(tagId) ?? new Set<string>()
      assetIds.add(asset.guid)
      tagMap.set(tagId, assetIds)
    }
  }

  public remove(guid: string): void {
    const asset = this.getByGuid(guid)
    if (asset) {
      const { assetMap, categoryMap, tagMap, normalizeTag, normalizeCategory } = this
      assetMap.delete(guid)

      for (const categoryPath of asset.categories) {
        const categoryId = normalizeCategory(categoryPath)
        const assetIds = categoryMap.get(categoryId)
        assetIds?.delete(guid)
      }

      for (const tag of asset.tags) {
        const tagId = normalizeTag(tag)
        const assetIds = tagMap.get(tagId)
        assetIds?.delete(guid)
      }
    }
  }

  protected _getAssets(assetIds: Iterable<string> | undefined): IAsset[] {
    if (assetIds === undefined) return []
    const assets: IAsset[] = []
    for (const assetId of assetIds) {
      const asset = this.assetMap.get(assetId)
      if (asset) assets.push(asset)
    }
    return assets
  }
}
