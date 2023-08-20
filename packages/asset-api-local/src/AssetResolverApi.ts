import { AssetDataType } from '@guanghechen/asset-types'
import type {
  IAsset,
  IAssetDataMap,
  IAssetPluginLocateInput,
  IAssetResolverApi,
} from '@guanghechen/asset-types'
import { mime, normalizeUrlPath } from '@guanghechen/asset-util'
import type { BinaryLike } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { v5 as uuid } from 'uuid'
import { calcFingerprint } from '../../asset-api/src/util/hash'
import type { IAssetUrlPrefixResolver } from './types'
import { assertExistedFilepath, assertSafeLocation, mkdirsIfNotExists } from './util/asset'

export interface ISaveOptions {
  prettier: boolean
}

export interface IAssetResolverApiProps {
  GUID_NAMESPACE: string // uuid
  sourceRoot: string
  staticRoot: string
  caseSensitive: boolean
  assetDataMapFilepath: string
  saveOptions: Partial<ISaveOptions>
  resolveUrlPathPrefix: IAssetUrlPrefixResolver
}

const extnameRegex = /\.([\w]+)$/

export class AssetResolverApi implements IAssetResolverApi {
  protected readonly GUID_NAMESPACE: string
  protected readonly sourceRoot: string
  protected readonly staticRoot: string
  protected readonly assetDataMapFilepath: string
  protected readonly caseSensitive: boolean
  protected readonly saveOptions: Readonly<ISaveOptions>
  protected readonly resolveUrlPathPrefix: IAssetUrlPrefixResolver

  constructor(props: IAssetResolverApiProps) {
    this.GUID_NAMESPACE = props.GUID_NAMESPACE
    this.sourceRoot = props.sourceRoot
    this.staticRoot = props.staticRoot
    this.assetDataMapFilepath = path.resolve(this.staticRoot, props.assetDataMapFilepath)

    this.saveOptions = { prettier: props.saveOptions.prettier ?? false }
    this.caseSensitive = props.caseSensitive
    this.resolveUrlPathPrefix = props.resolveUrlPathPrefix
  }

  public async initAsset(srcLocation: string): Promise<IAssetPluginLocateInput | null> {
    assertSafeLocation(this.sourceRoot, srcLocation)
    assertExistedFilepath(srcLocation)

    const stat = await fs.stat(srcLocation)
    const content = await fs.readFile(srcLocation)
    const hash = calcFingerprint(content)
    const filename = path.basename(srcLocation)
    const locationId = this.normalizeLocation(srcLocation)
    const guid = this._genAssetGuid(locationId)
    const src = this._normalizeLocation(this.sourceRoot, srcLocation)
    const extname: string | undefined = srcLocation.match(extnameRegex)?.[1]

    return {
      guid,
      hash,
      src,
      extname,
      createdAt: new Date(stat.birthtime).toISOString(),
      updatedAt: new Date(stat.mtime).toISOString(),
      title: filename
        .trim()
        .replace(/\s+/, ' ')
        .replace(/\.[^.]+$/, ''),
      filename,
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

    const dstLocation = path.join(this.staticRoot, uri.replace(/[?#][\s\S]+$/, ''))
    assertSafeLocation(this.staticRoot, dstLocation)
    mkdirsIfNotExists(dstLocation, false)

    switch (dataType) {
      case AssetDataType.BINARY:
        await fs.writeFile(dstLocation, data as BinaryLike, encoding)
        break
      case AssetDataType.JSON: {
        const content = JSON.stringify(data, null, this.saveOptions.prettier ? 2 : 0)
        await fs.writeFile(dstLocation, content, 'utf8')
        break
      }
      case AssetDataType.TEXT:
        await fs.writeFile(dstLocation, data as string, encoding)
        break
      default:
        throw new Error(`[${this.constructor.name}.saveAsset] Unexpected dataType: ${dataType}`)
    }
  }

  public async saveAssetDataMap(data: IAssetDataMap): Promise<void> {
    const content = JSON.stringify(data, null, this.saveOptions.prettier ? 2 : 0)
    mkdirsIfNotExists(this.assetDataMapFilepath, false)
    await fs.writeFile(this.assetDataMapFilepath, content, 'utf8')
  }

  public normalizeLocation(srcLocation: string): string {
    const relativeLocation: string = this._normalizeLocation(this.sourceRoot, srcLocation)
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

  public resolveSrcLocation(...pathPieces: string[]): string {
    return path.resolve(this.sourceRoot, ...pathPieces)
  }

  public resolveSlug(slug: string | null | undefined): string | null {
    return slug ?? null
  }

  public resolveUri(params: Pick<IAsset, 'guid' | 'type' | 'mimetype' | 'extname'>): string {
    const { guid, type, mimetype } = params
    const urlPathPrefix = this.resolveUrlPathPrefix({ assetType: type, mimetype })
    const extname: string | undefined = mime.getExtension(mimetype) ?? params.extname
    const url = `/${urlPathPrefix}/${guid}`
    return normalizeUrlPath(extname ? `${url}.${extname}` : url)
  }

  protected _normalizeLocation(rootDir: string, location: string): string {
    const relativeLocation = path.relative(rootDir, path.resolve(rootDir, location))
    return normalizeUrlPath(relativeLocation)
  }

  protected _genAssetGuid(identifier: string): string {
    return uuid(`#asset-${identifier}`, this.GUID_NAMESPACE)
  }

  protected _genLocationGuid(identifier: string): string {
    return uuid(`#location-${identifier}`, this.GUID_NAMESPACE)
  }
}
