import type { IAsset } from '@guanghechen/asset-core'
import fs from 'fs-extra'
import mime from 'mime'
import path from 'path'
import { v5 as uuid } from 'uuid'
import type { IAssetResolver } from './types/asset-resolver'
import { AssetDataType } from './types/misc'
import type { IAssetPluginResolveInput } from './types/plugin/resolve'
import { assetExistedFilepath, assetSafeLocation, mkdirsIfNotExists } from './util/asset'
import { calcFingerprint } from './util/hash'
import { normalizeRelativeUrlPath, normalizeSlug } from './util/misc'

export interface IAssetUrlPathPrefixMap {
  [key: string]: string
  _fallback: string
}

export interface ISaveOptions {
  prettier: boolean
}

export interface IAssetResolverProps {
  sourceRoot: string
  staticRoot: string
  urlPathPrefixMap: IAssetUrlPathPrefixMap
  caseSensitive: boolean
  saveOptions?: Partial<ISaveOptions>
  GUID_NAMESPACE?: string // uuid
}

export class AssetResolver implements IAssetResolver {
  protected readonly GUID_NAMESPACE: string
  protected readonly sourceRoot: string
  protected readonly staticRoot: string
  protected readonly urlPathPrefixMap: IAssetUrlPathPrefixMap
  protected readonly caseSensitive: boolean
  protected readonly saveOptions: Readonly<ISaveOptions>

  constructor(props: IAssetResolverProps) {
    const urlPathPrefixMap: IAssetUrlPathPrefixMap = { _fallback: 'asset' }
    for (const [key, value] of Object.entries(props.urlPathPrefixMap)) {
      urlPathPrefixMap[key] = normalizeRelativeUrlPath(value)
    }

    this.GUID_NAMESPACE = props.GUID_NAMESPACE ?? '188b0b6f-fc7e-4100-8b52-7615fd945c28'
    this.sourceRoot = props.sourceRoot
    this.staticRoot = props.staticRoot
    this.urlPathPrefixMap = urlPathPrefixMap
    this.caseSensitive = props.caseSensitive

    const { prettier = false } = props.saveOptions ?? {}
    this.saveOptions = { prettier }
  }

  public async initAsset(srcLocation: string): Promise<IAssetPluginResolveInput | null> {
    assetSafeLocation(this.sourceRoot, srcLocation)
    assetExistedFilepath(srcLocation)

    const stat = fs.statSync(srcLocation)
    const content = await fs.readFile(srcLocation)
    const hash = calcFingerprint(content)
    const filename = path.basename(srcLocation)
    const locationId = this.identifyLocation(srcLocation)
    const guid = this._genAssetGuid(locationId)
    const src = this._normalizeLocation(this.sourceRoot, srcLocation)

    return {
      guid,
      hash,
      src,
      createdAt: new Date(stat.ctime).toISOString(),
      updatedAt: new Date(stat.mtime).toISOString(),
      filename,
      title: filename
        .trim()
        .replace(/\s+/, ' ')
        .replace(/\.[^.]+$/, ''),
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
    assetSafeLocation(this.staticRoot, dstLocation)
    mkdirsIfNotExists(dstLocation, false)

    switch (dataType) {
      case AssetDataType.BINARY:
        await fs.writeFile(dstLocation, data, encoding)
        break
      case AssetDataType.JSON:
        await fs.writeJSON(dstLocation, data, {
          encoding,
          spaces: this.saveOptions.prettier ? '  ' : '',
        })
        break
      case AssetDataType.TEXT:
        await fs.writeFile(dstLocation, data, encoding)
        break
      default:
        throw new Error(`[AssetResolver.saveAsset] Unexpected dataType: ${dataType}`)
    }
  }

  public identifyLocation(location: string): string {
    const relativeLocation: string = this._normalizeLocation(this.sourceRoot, location)
    const text: string = this.caseSensitive ? relativeLocation : relativeLocation.toLowerCase()
    const identifier = this._genLocationGuid(text)
    return identifier
  }

  public async loadSrcContent(srcLocation: string): Promise<Buffer> {
    assetSafeLocation(this.sourceRoot, srcLocation)
    assetExistedFilepath(srcLocation)
    const content = await fs.readFile(srcLocation)
    return content
  }

  public resolveLocation(...pathPieces: string[]): string {
    return path.resolve(this.sourceRoot, ...pathPieces)
  }

  public resolveSlug(slug: string | null | undefined): string | null {
    return slug ?? null
  }

  public resolveUri(params: Pick<IAsset, 'guid' | 'type' | 'mimetype'>): string {
    const { guid, type, mimetype } = params
    const { urlPathPrefixMap } = this
    const urlPathPrefix = urlPathPrefixMap[type] ?? urlPathPrefixMap._fallback
    const extname: string | null = mime.getExtension(mimetype)
    let url = `/${urlPathPrefix}/${guid}`
    if (extname) url += '.' + extname
    return normalizeSlug(url)
  }

  protected _normalizeLocation(rootDir: string, location: string): string {
    const relativeLocation = path.relative(rootDir, path.resolve(rootDir, location))
    return normalizeRelativeUrlPath(relativeLocation)
  }

  protected _genAssetGuid(identifier: string): string {
    return uuid(`#asset-${identifier}`, this.GUID_NAMESPACE)
  }

  protected _genLocationGuid(identifier: string): string {
    return uuid(`#locate-${identifier}`, this.GUID_NAMESPACE)
  }
}
