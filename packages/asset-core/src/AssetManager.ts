import invariant from '@guanghechen/invariant'
import type { IAsset, IAssetId } from './types/asset'
import type { IAssetDataMap, IAssetManager } from './types/asset-manager'

export interface IAssetManagerProps {
  readonly identifierTag?: (tag: string) => string
  readonly identifierCategory?: (categoryPath: string[]) => string
}

const defaultAssetManagerProps: Required<IAssetManagerProps> = {
  identifierTag: tag => tag.replace(/[\s\\/]+/g, '').toLowerCase(),
  identifierCategory: categoryPath =>
    categoryPath
      .map(x => x.trim().replace(/\s+/g, '-'))
      .filter(x => !!x)
      .join('/'),
}

export class AssetManager implements IAssetManager {
  protected readonly assetMap: Map<IAssetId, IAsset> = new Map()
  protected readonly categoryMap: Map<string, IAssetId[]> = new Map()
  protected readonly tagMap: Map<string, IAssetId[]> = new Map()
  protected readonly identifierCategory: (categoryPath: string[]) => string
  protected readonly identifierTag: (tag: string) => string

  constructor(props: IAssetManagerProps = {}) {
    const {
      identifierCategory = defaultAssetManagerProps.identifierCategory,
      identifierTag = defaultAssetManagerProps.identifierTag,
    } = props ?? {}

    this.identifierCategory = identifierCategory
    this.identifierTag = identifierTag
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
    const assets: IAsset[] = Array.from(this.assetMap.values()).sort((x, y) =>
      x.uri.localeCompare(y.uri),
    )
    return { assets }
  }

  public getByGuid(guid: string): IAsset | undefined {
    return this.assetMap.get(guid)
  }

  public getByTag(tag: string): IAsset[] {
    const tagId = this.identifierTag(tag)
    const assetIds = this.tagMap.get(tagId)
    return this._getAssets(assetIds)
  }

  public getByCategory(categoryPath: string[]): IAsset[] {
    const categoryId = this.identifierCategory(categoryPath)
    const assetIds = this.categoryMap.get(categoryId)
    return this._getAssets(assetIds)
  }

  public insert(asset: IAsset): void {
    invariant(
      !this.assetMap.has(asset.guid),
      () => `[AssetManager.insert] Duplicated asset: guid=(${asset.guid})`,
    )

    const { assetMap, categoryMap, tagMap, identifierTag, identifierCategory } = this
    assetMap.set(asset.guid, asset)
    asset.categories.forEach(categoryPath => {
      const categoryId = identifierCategory(categoryPath)
      let assetIds = categoryMap.get(categoryId)
      if (assetIds === undefined) {
        assetIds = []
        categoryMap.set(categoryId, assetIds)
      }
      assetIds.push(asset.guid)
    })
    asset.tags.forEach(tag => {
      const tagId = identifierTag(tag)
      let assetIds = tagMap.get(tagId)
      if (assetIds === undefined) {
        assetIds = []
        tagMap.set(tagId, assetIds)
      }
      assetIds.push(asset.guid)
    })
  }

  public remove(guid: string): void {
    const asset = this.getByGuid(guid)
    if (asset) {
      const { assetMap, categoryMap, tagMap, identifierTag, identifierCategory } = this
      assetMap.delete(guid)
      asset.tags.forEach(tag => {
        const tagId = identifierTag(tag)
        const assetIds = tagMap.get(tagId)
        if (assetIds) {
          tagMap.set(
            tagId,
            assetIds.filter(assetId => assetId !== guid),
          )
        }
      })
      asset.categories.forEach(categoryPath => {
        const categoryId = identifierCategory(categoryPath)
        const assetIds = categoryMap.get(categoryId)
        if (assetIds) {
          categoryMap.set(
            categoryId,
            assetIds.filter(assetId => assetId !== guid),
          )
        }
      })
    }
  }

  protected _getAssets(assetIds: string[] | undefined): IAsset[] {
    if (assetIds === undefined) return []
    const assets: IAsset[] = []
    for (const assetId of assetIds) {
      const asset = this.assetMap.get(assetId)
      if (asset) assets.push(asset)
    }
    return assets
  }
}
