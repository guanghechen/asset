import type { IAssetId, IAssetTagId } from '../types/_misc'
import type { IAssetTag, IAssetTagDataMap, IAssetTagManager } from '../types/tag'
import { genTagGuid } from '../util/guid'
import { cloneJson, list2map } from '../util/json'

export interface IAssetTagManagerProps {
  resolveFingerprint?(label: string): string
  resolveLabel?(label: string): string
}

export class AssetTagManager implements IAssetTagManager {
  protected readonly fingerprintMap: Map<string, IAssetTagId> = new Map()
  protected readonly guidMap: Map<IAssetTagId, IAssetTag> = new Map()
  protected readonly resolveFingerprint: (label: string) => string
  protected readonly resolveLabel: (label: string) => string

  constructor(props: IAssetTagManagerProps = {}) {
    const {
      resolveFingerprint = label => label.replace(/[\s\\/]+/g, '').toLowerCase(),
      resolveLabel = label => label.replace(/[\s\\/]+/g, ' '),
    } = props
    this.resolveFingerprint = resolveFingerprint
    this.resolveLabel = resolveLabel
  }

  public fromJSON(json: Readonly<IAssetTagDataMap>): void {
    const { fingerprintMap, guidMap } = this
    fingerprintMap.clear()
    guidMap.clear()

    list2map(
      json.entities,
      entity => entity.fingerprint,
      entity => entity.guid,
      fingerprintMap,
    )
    list2map(
      json.entities,
      entity => entity.guid,
      entity => entity,
      guidMap,
    )
  }

  public toJSON(): IAssetTagDataMap {
    const entities: IAssetTag[] = Array.from(this.guidMap.values()).filter(
      entity => entity.assets.length > 0,
    )
    return cloneJson({ entities })
  }

  public findByGuid(guid: IAssetTagId): IAssetTag | undefined {
    return this.guidMap.get(guid)
  }

  public findByFingerprint(fingerprint: string): IAssetTag | undefined {
    const guid = this.fingerprintMap.get(fingerprint)
    return guid ? this.guidMap.get(guid) : undefined
  }

  public insert(tagLabel: string, assetId: IAssetId): IAssetTag | undefined {
    const fingerprint = this.resolveFingerprint(tagLabel)
    if (!fingerprint) return undefined

    const existedTag = this.findByFingerprint(fingerprint)
    if (existedTag) {
      if (!existedTag.assets.includes(assetId)) existedTag.assets.push(assetId)
      return existedTag
    }

    const newTag: IAssetTag = {
      guid: genTagGuid(fingerprint),
      fingerprint: fingerprint,
      label: this.resolveLabel(tagLabel),
      assets: [assetId],
    }
    this.guidMap.set(newTag.guid, newTag)
    this.fingerprintMap.set(fingerprint, newTag.guid)
    return newTag
  }

  public remove(guid: IAssetTagId, assetId: IAssetId): void {
    const tag = this.findByGuid(guid)
    if (tag) tag.assets = tag.assets.filter(id => id !== assetId)
  }
}
