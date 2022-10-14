import { AssetDataType } from '@guanghechen/asset-core'
import type { IAsset } from '@guanghechen/asset-core'
import type { IAssetPluginParseInput, IAssetResolver } from '@guanghechen/asset-core-plugin'
import { normalizeUrlPath } from '@guanghechen/asset-core-plugin'
import fs from 'fs-extra'
import mime from 'mime'
import path from 'path'
import { v5 as uuid } from 'uuid'
import { assertExistedFilepath, assertSafeLocation, mkdirsIfNotExists } from './util/asset'
import { calcFingerprint } from './util/hash'

export type IAssetUrlPrefixResolver = (params: { assetType: string; mimetype: string }) => string

export interface ISaveOptions {
  prettier: boolean
}

export interface IAssetResolverProps {
  GUID_NAMESPACE: string // uuid
  sourceRoot: string
  staticRoot: string
  caseSensitive: boolean
  saveOptions?: Partial<ISaveOptions>
  resolveUrlPathPrefix: IAssetUrlPrefixResolver
}

export class AssetResolver implements IAssetResolver {
  protected readonly GUID_NAMESPACE: string
  protected readonly sourceRoot: string
  protected readonly staticRoot: string
  protected readonly caseSensitive: boolean
  protected readonly saveOptions: Readonly<ISaveOptions>
  protected readonly resolveUrlPathPrefix: IAssetUrlPrefixResolver

  constructor(props: IAssetResolverProps) {
    this.GUID_NAMESPACE = props.GUID_NAMESPACE
    this.sourceRoot = props.sourceRoot
    this.staticRoot = props.staticRoot
    this.caseSensitive = props.caseSensitive
    this.resolveUrlPathPrefix = props.resolveUrlPathPrefix

    const { prettier = false } = props.saveOptions ?? {}
    this.saveOptions = { prettier }
  }

  public async initAsset(srcLocation: string): Promise<IAssetPluginParseInput | null> {
    assertSafeLocation(this.sourceRoot, srcLocation)
    assertExistedFilepath(srcLocation)

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
      createdAt: new Date(stat.birthtime).toISOString(),
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
    assertSafeLocation(this.staticRoot, dstLocation)
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
    assertSafeLocation(this.sourceRoot, srcLocation)
    assertExistedFilepath(srcLocation)
    const content = await fs.readFile(srcLocation)
    return content
  }

  public loadSrcContentSync(srcLocation: string): Buffer | null {
    assertSafeLocation(this.sourceRoot, srcLocation)
    assertExistedFilepath(srcLocation)
    const content = fs.readFileSync(srcLocation)
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
    const urlPathPrefix = this.resolveUrlPathPrefix({ assetType: type, mimetype })
    const extname: string | null = mime.getExtension(mimetype)
    let url = `/${urlPathPrefix}/${guid}`
    if (extname) url += '.' + extname
    return normalizeUrlPath(url)
  }

  protected _normalizeLocation(rootDir: string, location: string): string {
    const relativeLocation = path.relative(rootDir, path.resolve(rootDir, location))
    return normalizeUrlPath(relativeLocation)
  }

  protected _genAssetGuid(identifier: string): string {
    return uuid(`#asset-${identifier}`, this.GUID_NAMESPACE)
  }

  protected _genLocationGuid(identifier: string): string {
    return uuid(`#locate-${identifier}`, this.GUID_NAMESPACE)
  }
}
