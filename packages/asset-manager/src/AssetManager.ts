import type { IAsset, IAssetDataMap, IAssetManager } from '@guanghechen/asset-types'

const regex = /[\s\\/]+/g
const normalize = (text: string): string => text.trim().replace(regex, '_').toLowerCase()

export class AssetManager implements IAssetManager {
  protected readonly _assetMap: Map<string, IAsset>
  protected readonly _categoryMap: Map<string, Set<string>>
  protected readonly _tagMap: Map<string, Set<string>>

  constructor() {
    this._assetMap = new Map()
    this._categoryMap = new Map()
    this._tagMap = new Map()
  }

  public dump(): IAssetDataMap {
    return {
      assets: Array.from(this._assetMap.values()).sort((x, y) => x.uri.localeCompare(y.uri)),
    }
  }

  public find(predicate: (asset: Readonly<IAsset>) => boolean): IAsset | null {
    for (const asset of this._assetMap.values()) {
      if (predicate(asset)) return asset
    }
    return null
  }

  public has(guid: string): boolean {
    return this._assetMap.has(guid)
  }

  public get(guid: string): IAsset | undefined {
    return this._assetMap.get(guid)
  }

  public getByTag(tag: string): IAsset[] {
    const tagId = this._normalizeTag(tag)
    const assetIds = this._tagMap.get(tagId)
    return this._getAssets(assetIds)
  }

  public getByCategory(categoryPath: ReadonlyArray<string>): IAsset[] {
    const categoryId = this._normalizeCategory(categoryPath)
    const assetIds = this._categoryMap.get(categoryId)
    return this._getAssets(assetIds)
  }

  public insert(asset: Readonly<IAsset>): void | never {
    if (this._assetMap.has(asset.guid)) {
      throw new Error(`[AssetManager.insert] Duplicated asset: guid({${asset.guid}})`)
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

  public load(json: Readonly<IAssetDataMap>, replace: boolean): void {
    if (replace) {
      this._assetMap.clear()
      this._categoryMap.clear()
      this._tagMap.clear()
    }
    json.assets.forEach(asset => this.insert(asset))
  }

  public remove(guid: string): void {
    const asset = this.get(guid)
    if (asset) {
      const assetMap: Map<string, IAsset> = this._assetMap
      const categoryMap: Map<string, Set<string>> = this._categoryMap
      const tagMap: Map<string, Set<string>> = this._tagMap
      const { _normalizeTag: normalizeTag, _normalizeCategory: normalizeCategory } = this
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

  protected _normalizeCategory(categoryPath: ReadonlyArray<string>): string {
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
