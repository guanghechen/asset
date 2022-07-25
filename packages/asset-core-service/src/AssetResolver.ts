import invariant from '@guanghechen/invariant'
import fs from 'fs-extra'
import path from 'node:path'
import type { IAssetResolver } from './types/asset-resolver'
import type { IBuffer } from './types/misc'
import { AssetDataType } from './types/misc'
import type { IAssetPluginResolveInput } from './types/plugin/resolve'
import { genAssetGuid } from './util/guid'
import { calcFingerprint } from './util/hash'
import { normalizeRelativeUrlPath } from './util/misc'

export interface IAssetUrlPathPrefixMap {
  [key: string]: string
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

  public async initAsset(srcLocation: string): Promise<IAssetPluginResolveInput | null> {
    this._validateSrcLocation(this.sourceRoot, srcLocation)
    const stat = fs.statSync(srcLocation)
    invariant(stat.isFile(), `Not a file. (${srcLocation})`)

    const content = await fs.readFile(srcLocation)
    const filename = path.basename(srcLocation)
    const locationId = this.identifyLocation(srcLocation)
    const guid = genAssetGuid(locationId)
    const hash = calcFingerprint(content)
    const src = this._normalizeLocation(srcLocation)

    return {
      guid,
      hash,
      src,
      createdAt: new Date(stat.ctime).toISOString(),
      updatedAt: new Date(stat.mtime).toISOString(),
      filename,
      content,
    }
  }

  public async saveAsset(params: {
    uri: string
    dataType: AssetDataType
    data: unknown
    encoding?: BufferEncoding
  }): Promise<void> {
    const { uri, dataType, data, encoding } = params
    if (data === null) return

    const dstLocation = path.join(this.staticRoot, uri)
    this._validateSrcLocation(this.staticRoot, dstLocation)

    switch (dataType) {
      case AssetDataType.BINARY:
        await fs.writeFile(dstLocation, data, encoding)
        break
      case AssetDataType.JSON:
        await fs.writeJSON(dstLocation, dstLocation, encoding)
        break
      case AssetDataType.TEXT:
        await fs.writeFile(dstLocation, data, encoding)
        break
      default:
        throw new Error(`[AssetResolver.saveAsset] Unexpected dataType: ${dataType}`)
    }
  }

  public identifyLocation(location: string): string {
    const relativeLocation: string = this._normalizeLocation(location)
    const text: string = this.caseSensitive ? relativeLocation : relativeLocation.toLowerCase()
    const identifier = genAssetGuid(text)
    return identifier
  }

  public async loadSrcContent(srcLocation: string): Promise<IBuffer> {
    this._validateSrcLocation(this.sourceRoot, srcLocation)
    const content = await fs.readFile(srcLocation)
    return content
  }

  public resolveLocation(...pathPieces: string[]): string {
    return path.resolve(this.sourceRoot, ...pathPieces)
  }

  public resolveSlug(slug: string | undefined): string {
    return slug ?? '/'
  }

  public resolveUri(params: { guid: string; type: string; extname: string }): string {
    const { guid, type, extname } = params
    const { urlPathPrefixMap } = this
    const urlPathPrefix = urlPathPrefixMap[type] ?? urlPathPrefixMap._fallback
    return `/${urlPathPrefix}/${guid}${extname}`
  }

  protected _normalizeLocation(location: string): string {
    const relativeLocation = path.relative(this.sourceRoot, path.resolve(this.sourceRoot, location))
    return normalizeRelativeUrlPath(relativeLocation)
  }

  protected _validateSrcLocation(rootDir: string, location: string): void {
    invariant(
      location.startsWith(rootDir),
      `[AssetResolver] !!!unsafe location. rootDir: ${rootDir}, location: ${location}`,
    )
    invariant(fs.existsSync(location), `[AssetResolver] Cannot find file. (${location})`)
  }
}
