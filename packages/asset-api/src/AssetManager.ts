import type { IAsset, IAssetDataMap, IAssetManager } from '@guanghechen/asset-types'

const regex = /[\s\\/]+/g
const normalize = (text: string): string => text.trim().replace(regex, '_').toLowerCase()

export class AssetManager implements IAssetManager {
  protected readonly _assetMap: Map<string, IAsset> = new Map()
  protected readonly _categoryMap: Map<string, Set<string>> = new Map()
  protected readonly _tagMap: Map<string, Set<string>> = new Map()

  public load(json: Readonly<IAssetDataMap>, replace: boolean): void {
    if (replace) {
      this._assetMap.clear()
      this._categoryMap.clear()
      this._tagMap.clear()
    }
    json.assets.forEach(asset => this.insert(asset))
  }

  public dump(): IAssetDataMap {
    return {
      assets: Array.from(this._assetMap.values()).sort((x, y) => x.uri.localeCompare(y.uri)),
    }
  }

  public getByGuid(guid: string): IAsset | undefined {
    return this._assetMap.get(guid)
  }

  public getByTag(tag: string): IAsset[] {
    const tagId = this._normalizeTag(tag)
    const assetIds = this._tagMap.get(tagId)
    return this._getAssets(assetIds)
  }

  public getByCategory(categoryPath: string[]): IAsset[] {
    const categoryId = this._normalizeCategory(categoryPath)
    const assetIds = this._categoryMap.get(categoryId)
    return this._getAssets(assetIds)
  }

  public insert(asset: IAsset): void {
    if (this._assetMap.has(asset.guid)) {
      console.error(`[AssetManager.insert] Duplicated asset: guid(${asset.guid})`)
      return
    }

    const {
      _assetMap: assetMap,
      _categoryMap: categoryMap,
      _tagMap: tagMap,
      _normalizeTag: normalizeTag,
      _normalizeCategory: normalizeCategory,
    } = this
    assetMap.set(asset.guid, asset)

    for (const categoryPath of asset.categories) {
      const categoryId = normalizeCategory(categoryPath)
      let assetIds: Set<string> | undefined = categoryMap.get(categoryId)
      if (assetIds === undefined) {
        assetIds = new Set<string>()
        categoryMap.set(categoryId, assetIds)
      }
      assetIds.add(asset.guid)
    }

    for (const tag of asset.tags) {
      const tagId = normalizeTag(tag)
      let assetIds: Set<string> | undefined = tagMap.get(tagId)
      if (assetIds === undefined) {
        assetIds = new Set<string>()
        tagMap.set(tagId, assetIds)
      }
      assetIds.add(asset.guid)
    }
  }

  public remove(guid: string): void {
    const asset = this.getByGuid(guid)
    if (asset) {
      const {
        _assetMap: assetMap,
        _categoryMap: categoryMap,
        _tagMap: tagMap,
        _normalizeTag: normalizeTag,
        _normalizeCategory: normalizeCategory,
      } = this
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

  protected _normalizeTag(tag: string): string {
    return normalize(tag)
  }

  protected _normalizeCategory(categoryPath: string[]): string {
    return categoryPath
      .map(normalize)
      .filter(x => !!x)
      .join('/')
  }

  protected _getAssets(assetIds: Iterable<string> | undefined): IAsset[] {
    if (assetIds === undefined) return []
    const assets: IAsset[] = []
    for (const assetId of assetIds) {
      const asset = this._assetMap.get(assetId)
      if (asset) assets.push(asset)
    }
    return assets
  }
}
