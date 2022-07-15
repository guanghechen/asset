import { genAssetGuid } from '@guanghechen/asset-core'
import invariant from '@guanghechen/invariant'
import fs from 'fs-extra'
import path from 'node:path'
import type { IAssetEntity } from './types/asset'
import { AssetType } from './types/asset'
import type { IAssetResolver } from './types/asset-resolver'
import { calcFingerprint } from './util/hash'
import { normalizeRelativeUrlPath } from './util/misc'

export interface IAssetUrlPathPrefixMap {
  [key: AssetType | string]: string
  _fallback: string
}

export interface IAssetResolverProps {
  sourceRoot: string
  staticRoot: string
  urlPathPrefixMap: IAssetUrlPathPrefixMap
  caseSensitive: boolean
}

export class AssetResolver implements IAssetResolver {
  protected readonly sourceRoot: string
  protected readonly staticRoot: string
  protected readonly urlPathPrefixMap: IAssetUrlPathPrefixMap
  protected readonly caseSensitive: boolean

  constructor(props: IAssetResolverProps) {
    const urlPathPrefixMap: IAssetUrlPathPrefixMap = { _fallback: 'asset' }
    for (const [key, value] of Object.entries(props.urlPathPrefixMap)) {
      urlPathPrefixMap[key] = normalizeRelativeUrlPath(value)
    }

    this.sourceRoot = props.sourceRoot
    this.staticRoot = props.staticRoot
    this.urlPathPrefixMap = urlPathPrefixMap
    this.caseSensitive = props.caseSensitive
  }

  public async initAsset(location: string): Promise<IAssetEntity | null> {
    invariant(fs.existsSync(location), `Cannot find file. (${location})`)

    const stat = fs.statSync(location)
    invariant(stat.isFile(), `Not a file. (${location})`)

    const content = await fs.readFile(location)

    const { ext: extname, name: title } = path.parse(location)
    const locationId = this.identifyLocation(location)
    const guid = genAssetGuid(locationId)
    const hash = calcFingerprint(content)
    const type = AssetType.FILE
    const src = this._normalizeLocation(location)
    const uri = this.resolveUri({ guid, type, extname })

    return {
      guid,
      hash,
      type,
      src,
      extname,
      uri,
      slug: null,
      title,
      data: content,
      tags: [],
      categories: [],
      createdAt: new Date(stat.ctime).toISOString(),
      updatedAt: new Date(stat.mtime).toISOString(),
    }
  }

  public saveAsset(asset: Readonly<IAssetEntity>): Promise<void> {
    const location = path.join(this.staticRoot, asset.uri)
    invariant(location.startsWith(this.staticRoot), `[saveAsset] unsafe uri (${asset.uri}).`)
    throw new Error('Method not implemented.')
  }

  public identifyLocation(location: string): string {
    const relativeLocation: string = this._normalizeLocation(location)
    const text: string = this.caseSensitive ? relativeLocation : relativeLocation.toLowerCase()
    const identifier = genAssetGuid(text)
    return identifier
  }

  public resolveLocation(...pathPieces: string[]): string {
    return path.resolve(this.sourceRoot, ...pathPieces)
  }

  public resolveSlug(slug: string | undefined): string {
    return slug ?? '/'
  }

  public resolveUri(asset: Pick<IAssetEntity, 'guid' | 'type' | 'extname'>): string {
    const { urlPathPrefixMap } = this
    const urlPathPrefix = urlPathPrefixMap[asset.type] ?? urlPathPrefixMap._fallback
    return `/${urlPathPrefix}/${asset.guid}${asset.extname}`
  }

  protected _normalizeLocation(location: string): string {
    const relativeLocation = path.relative(this.sourceRoot, path.resolve(this.sourceRoot, location))
    return normalizeRelativeUrlPath(relativeLocation)
  }
}
