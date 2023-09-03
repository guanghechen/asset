import { AssetDataType } from '@guanghechen/asset-types'
import type {
  IAssetDataMap,
  IAssetManager,
  IAssetResolver,
  IAssetResolverApi,
  IAssetResolverLocator,
  IAssetSourceStorage,
  IAssetTargetStorage,
  IAssetTaskApi,
  IBinaryLike,
} from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import type { IReporter } from '@guanghechen/types'

interface IProps {
  api: IAssetResolverApi
  manager: IAssetManager
  locator: IAssetResolverLocator
  resolver: IAssetResolver
  reporter: IReporter
  sourceStorage: IAssetSourceStorage
  targetStorage: IAssetTargetStorage
  dataMapUri: string
  delayAfterContentChanged?: number
}

export class AssetTaskApi implements IAssetTaskApi {
  public readonly delayAfterContentChanged: number
  protected readonly _api: IAssetResolverApi
  protected readonly _locator: IAssetResolverLocator
  protected readonly _resolver: IAssetResolver
  protected readonly _reporter: IReporter
  protected readonly _sourceStorage: IAssetSourceStorage
  protected readonly _targetStorage: IAssetTargetStorage
  protected readonly _manager: IAssetManager
  protected readonly _dataMapUri: string

  constructor(props: IProps) {
    this.delayAfterContentChanged = Number.isNaN(props.delayAfterContentChanged)
      ? 200
      : Number(props.delayAfterContentChanged)
    this._api = props.api
    this._manager = props.manager
    this._locator = props.locator
    this._resolver = props.resolver
    this._reporter = props.reporter
    this._sourceStorage = props.sourceStorage
    this._targetStorage = props.targetStorage
    this._dataMapUri = props.dataMapUri
  }

  public async saveAssetDataMap(): Promise<void> {
    const data: IAssetDataMap = this._manager.dump()
    await this._saveAsset(this._dataMapUri, AssetDataType.JSON, data, undefined)
  }

  public async resolveSrcLocation(srcLocation: string): Promise<string> {
    return this._sourceStorage.absolute(srcLocation)
  }

  public async create(locations: string[]): Promise<void> {
    const { _resolver, _locator, _api } = this
    const results = await _resolver.resolve(locations, _locator, _api)
    for (const result of results) {
      if (result) {
        const { uri, dataType, data, encoding } = result
        await this._saveAsset(uri, dataType, data, encoding)
      }
    }
  }

  public async remove(locations: string[]): Promise<void> {
    const { _api, _locator } = this
    for (const location of locations) {
      const locationId: string = _api.identifyLocation(location)
      const asset = await _locator.locateAsset(locationId)

      await _locator.removeAsset(locationId)
      if (asset) await this._removeAsset(asset.uri)
    }
  }

  public async update(locations: string[]): Promise<void> {
    const { _api, _locator } = this
    for (const location of locations) {
      const locationId: string = _api.identifyLocation(location)
      await _locator.removeAsset(locationId)
    }
    await this.create(locations)
  }

  protected async _saveAsset(
    uri: string,
    dataType: AssetDataType,
    data: unknown | null,
    encoding: BufferEncoding | undefined,
  ): Promise<void> {
    if (data === null) return

    const dstLocation: string = await this._resolveDstLocationFromUri(uri)
    this._reporter.verbose('[saveAsset] uri: {}', uri)

    const { _targetStorage } = this
    await _targetStorage.assertSafeLocation(dstLocation)
    await _targetStorage.mkdirsIfNotExists(dstLocation, false)

    switch (dataType) {
      case AssetDataType.BINARY:
        await _targetStorage.writeBinaryFile(dstLocation, data as IBinaryLike)
        break
      case AssetDataType.JSON: {
        await _targetStorage.writeJsonFile(dstLocation, data)
        break
      }
      case AssetDataType.TEXT:
        invariant(
          !!encoding,
          `[${this.constructor.name}.saveAsset] encoding is required for text type file`,
        )
        await _targetStorage.writeTextFile(dstLocation, data as string, encoding)
        break
      default:
        throw new Error(`[${this.constructor.name}.saveAsset] Unexpected dataType: ${dataType}`)
    }
  }

  protected async _removeAsset(uri: string): Promise<void> {
    const dstLocation: string = await this._resolveDstLocationFromUri(uri)
    this._reporter.verbose('[removeAsset] uri({}), dstLocation({})', uri, dstLocation)
    await this._targetStorage.removeFile(dstLocation)
  }

  protected async _resolveDstLocationFromUri(uri: string): Promise<string> {
    return this._targetStorage.absolute(uri.replace(/^[/\\]/, '').replace(/[?#][\s\S]+$/, ''))
  }
}
