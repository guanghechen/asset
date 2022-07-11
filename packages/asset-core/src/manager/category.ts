import type { IAssetCategoryId, IAssetId } from '../types/_misc'
import type {
  IAssetCategory,
  IAssetCategoryDataMap,
  IAssetCategoryManager,
} from '../types/category'
import { genCategoryGuid } from '../util/guid'
import { cloneJson, list2map } from '../util/misc'

export interface ICategoryManagerProps {
  resolveFingerprint?(categoryPath: string): string
  resolveLabels?(categoryPath: string): string[]
}

export class AssetCategoryManager implements IAssetCategoryManager {
  protected readonly fingerprintMap: Map<string, IAssetCategoryId> = new Map()
  protected readonly guidMap: Map<IAssetCategoryId, IAssetCategory> = new Map()
  protected readonly resolveFingerprint: (categoryPath: string) => string
  protected readonly resolveLabels: (categoryPath: string) => string[]
  protected _isCleaned = false

  constructor(props: ICategoryManagerProps = {}) {
    const {
      resolveFingerprint = categoryPath =>
        categoryPath
          .replace(/[\s]+/g, '')
          .split(/[/\\]+/g)
          .filter(x => !!x)
          .join('/'),
      resolveLabels = categoryPath =>
        categoryPath
          .split(/[/\\]+/g)
          .map(x => x.trim().replace(/[\s]+/g, ' '))
          .filter(x => !!x),
    } = props
    this.resolveLabels = resolveLabels
    this.resolveFingerprint = resolveFingerprint
  }

  public fromJSON(json: Readonly<IAssetCategoryDataMap>): void {
    const { fingerprintMap, guidMap } = this
    fingerprintMap.clear()
    guidMap.clear()

    list2map(
      json.categories,
      entity => entity.fingerprint,
      entity => entity.guid,
      fingerprintMap,
    )
    list2map(
      json.categories,
      entity => entity.guid,
      entity => entity,
      guidMap,
    )
  }

  public toJSON(): IAssetCategoryDataMap {
    this.cleanup()
    const categories: IAssetCategory[] = Array.from(this.guidMap.values())
    return cloneJson({ categories })
  }

  public findByGuid(guid: IAssetCategoryId): IAssetCategory | undefined {
    return this.guidMap.get(guid)
  }

  public findByFingerprint(identifier: string): IAssetCategory | undefined {
    const guid = this.fingerprintMap.get(identifier)
    return guid ? this.guidMap.get(guid) : undefined
  }

  public insert(categoryPath: string, assetId: IAssetId): IAssetCategory | undefined {
    const fingerprint = this.resolveFingerprint(categoryPath)
    if (!fingerprint) return undefined

    const existedCategory = this.findByFingerprint(fingerprint)
    if (existedCategory) {
      if (!existedCategory.assets.includes(assetId)) existedCategory.assets.push(assetId)
      return existedCategory
    }

    const labels = this.resolveLabels(categoryPath)
    const category: IAssetCategory = {
      guid: genCategoryGuid(fingerprint),
      fingerprint,
      path: labels.slice(),
      assets: [assetId],
      parent: null,
      children: [],
    }

    // Add parents.
    {
      let child: IAssetCategory = category
      for (let i = labels.length - 2; i >= 0; --i) {
        const parentLabels = labels.slice(0, i + 1)
        const parentFingerprint = this.resolveFingerprint(parentLabels.join('/'))
        if (!parentFingerprint) break

        const existedParent = this.findByFingerprint(parentFingerprint)
        if (existedParent) {
          child.parent = existedParent.guid
          existedParent.children.push(child.guid)
          break
        }

        const parent: IAssetCategory = {
          guid: genCategoryGuid(parentFingerprint),
          fingerprint: parentFingerprint,
          path: parentLabels,
          assets: [],
          parent: null,
          children: [child.guid],
        }
        child.parent = parent.guid
        child = parent
      }
    }
    return category
  }

  public remove(guid: IAssetCategoryId, assetId: IAssetId): void {
    const category = this.findByGuid(guid)
    if (category) {
      category.assets = category.assets.filter(id => id !== assetId)
      if (category.assets.length <= 0) this._isCleaned = false
    }
  }

  protected cleanup(): void {
    if (this._isCleaned) return

    const { fingerprintMap, guidMap } = this
    const recursiveRemove = (category: IAssetCategory): void => {
      if (category.children.length > 0 || category.assets.length > 0) return
      fingerprintMap.delete(category.fingerprint)
      guidMap.delete(category.guid)
      const parent = category.parent ? this.findByGuid(category.parent) : undefined
      if (parent) {
        parent.children = parent.children.filter(guid => guid !== category.guid)
        recursiveRemove(parent)
      }
    }

    const categories: IAssetCategory[] = Array.from(guidMap.values())
    for (const c of categories) recursiveRemove(c)
    this._isCleaned = true
  }
}
