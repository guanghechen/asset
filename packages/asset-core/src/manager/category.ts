import type { IAssetCategoryId, IAssetId } from '../types/_misc'
import type { IAssetCategory, IAssetCategoryManager, IAssetCategoryMap } from '../types/category'
import { genCategoryGuid } from '../util/guid'
import { cloneJson, list2map } from '../util/json'

const normalizeLabel = (label: string): string => label.replace(/[\s/\\]+/g, ' ')
const normalizePath = (path: string[]): string => path.map(normalizeLabel).join('/')

export interface ICategoryManagerProps {
  entities: ReadonlyArray<IAssetCategory>
}

export class AssetCategoryManager implements IAssetCategoryManager {
  protected readonly _idMap: Map<string, IAssetCategoryId>
  protected readonly _guidMap: Map<IAssetCategoryId, IAssetCategory>

  constructor(props: ICategoryManagerProps) {
    const entities = props.entities
    this._idMap = list2map(
      entities,
      entity => entity.identifier,
      entity => entity.guid,
    )
    this._guidMap = list2map(
      entities,
      entity => entity.guid,
      entity => entity,
    )

    for (const category of entities) this._removeEmptyCategory(category)
  }

  public dump(): IAssetCategoryMap {
    const entities: IAssetCategory[] = Array.from(this._guidMap.values())
    return cloneJson({ entities })
  }

  public findByGuid(guid: IAssetCategoryId): IAssetCategory | undefined {
    return this._guidMap.get(guid)
  }

  public findByIdentifier(identifier: string): IAssetCategory | undefined {
    const guid = this._idMap.get(identifier)
    return guid ? this._guidMap.get(guid) : undefined
  }

  public insert(categoryPath: ReadonlyArray<string>, assetId: IAssetId): this {
    let category: IAssetCategory | undefined
    const path: string[] = []
    for (const piece of categoryPath) {
      path.push(piece)
      const identifier = normalizePath(path)
      let nextCategory: IAssetCategory | undefined = this.findByIdentifier(identifier)
      if (!nextCategory) {
        nextCategory = {
          guid: genCategoryGuid(identifier),
          identifier,
          label: normalizeLabel(piece),
          assets: [],
          parents: [],
          children: [],
        }
        this._guidMap.set(nextCategory.guid, nextCategory)
        this._idMap.set(identifier, nextCategory.guid)

        if (category) {
          category.children.push(nextCategory.guid)
          nextCategory.parents.push(category.guid)
        }
      }
      category = nextCategory
    }

    if (category) {
      category.assets.push(assetId)
    }
    return this
  }

  public remove(guid: IAssetCategoryId, assetId: IAssetId): this {
    const category = this.findByGuid(guid)
    if (category) {
      category.assets = category.assets.filter(id => id !== assetId)
      this._removeEmptyCategory(category)
    }
    return this
  }

  protected _removeEmptyCategory(category: IAssetCategory): void {
    if (category.children.length <= 0 || category.assets.length > 0) return

    this._idMap.delete(category.identifier)
    this._guidMap.delete(category.guid)
    for (const parentId of category.parents) {
      const parent = this.findByGuid(parentId)
      if (parent) {
        parent.children = parent.children.filter(id => id !== category.guid)
        this._removeEmptyCategory(parent)
      }
    }
  }
}
