import type { IAssetId, IAssetTagId } from '../types/_misc'
import type { IAssetTag, IAssetTagManager, IAssetTagMap } from '../types/tag'
import { genTagGuid } from '../util/guid'
import { cloneJson, list2map } from '../util/json'

const utils = {
  normalizeIdentifier: (label: string): string => label.replace(/[\s]+/g, '').toLowerCase(),
  normalizeLabel: (label: string): string => label.replace(/[\s]+/g, ' '),
}

export interface IAssetTagManagerProps {
  entities: ReadonlyArray<IAssetTag>
}

export class AssetTagManager implements IAssetTagManager {
  protected readonly _idMap: Map<string, IAssetTagId>
  protected readonly _guidMap: Map<IAssetTagId, IAssetTag>

  constructor(props: IAssetTagManagerProps) {
    const entities = props.entities.filter(entity => entity.assets.length > 0)
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
  }

  public dump(): IAssetTagMap {
    const entities: IAssetTag[] = Array.from(this._guidMap.values())
    return cloneJson({ entities })
  }

  public findByGuid(guid: IAssetTagId): IAssetTag | undefined {
    return this._guidMap.get(guid)
  }

  public findByIdentifier(identifier: string): IAssetTag | undefined {
    const guid = this._idMap.get(identifier)
    return guid ? this._guidMap.get(guid) : undefined
  }

  public insert(tagLabel: string, assetId: IAssetId): IAssetTag {
    const identifier = utils.normalizeIdentifier(tagLabel)
    const existedTag = this.findByIdentifier(identifier)
    if (existedTag) {
      if (!existedTag.assets.includes(assetId)) {
        existedTag.assets.push(assetId)
      }
      return existedTag
    }

    const newTag: IAssetTag = {
      guid: genTagGuid(identifier),
      identifier,
      label: utils.normalizeLabel(tagLabel),
      assets: [assetId],
    }
    this._guidMap.set(newTag.guid, newTag)
    this._idMap.set(identifier, newTag.guid)
    return newTag
  }

  public remove(guid: IAssetTagId, assetId: IAssetId): this {
    const tag = this.findByGuid(guid)
    if (tag) {
      tag.assets = tag.assets.filter(id => id !== assetId)
      this._removeEmptyTag(tag)
    }
    return this
  }

  protected _removeEmptyTag(tag: IAssetTag): void {
    if (tag.assets.length > 0) return
    this._idMap.delete(tag.identifier)
    this._guidMap.delete(tag.guid)
  }
}
