import { AssetDataType } from '@guanghechen/asset-types'
import type {
  IAssetDataMap,
  IAssetResolver,
  IAssetResolverApi,
  IAssetTargetStorage,
  IAssetTaskApi,
  IBinaryLike,
} from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import type { IReporter } from '@guanghechen/types'

interface IProps {
  api: IAssetResolverApi
  resolver: IAssetResolver
  reporter: IReporter
  targetStorage: IAssetTargetStorage
  dataMapUri: string
  delayAfterContentChanged?: number
}

export class AssetTaskApi implements IAssetTaskApi {
  public readonly delayAfterContentChanged: number
  protected readonly _api: IAssetResolverApi
  protected readonly _resolver: IAssetResolver
  protected readonly _reporter: IReporter
  protected readonly _targetStorage: IAssetTargetStorage
  protected readonly _dataMapUri: string

  constructor(props: IProps) {
    this.delayAfterContentChanged = Number.isNaN(props.delayAfterContentChanged)
      ? 200
      : Number(props.delayAfterContentChanged)
    this._api = props.api
    this._resolver = props.resolver
    this._reporter = props.reporter
    this._targetStorage = props.targetStorage
    this._dataMapUri = props.dataMapUri
  }

  public async create(locations: string[]): Promise<void> {
    const { _resolver, _api } = this
    const results = await _resolver.resolve(locations, _api)
    const tasks: Array<Promise<void>> = []

    for (const result of results) {
      const { asset, dataType, data, encoding } = result
      tasks.push(this._saveAsset(asset.uri, dataType, data, encoding))
    }

    if (tasks.length > 0) tasks.push(this._saveAssetDataMap())

    await Promise.all(tasks)
  }

  public async remove(locations: string[]): Promise<void> {
    const { _api } = this
    const tasks: Array<Promise<void>> = []

    for (const location of locations) {
      const asset = await _api.locateAsset(location)
      tasks.push(_api.removeAsset(location))
      if (asset) tasks.push(this._removeAsset(asset.uri))
    }

    if (tasks.length > 0) tasks.push(this._saveAssetDataMap())

    await Promise.all(tasks)
  }

  public async update(locations: string[]): Promise<void> {
    const { _api } = this
    await Promise.all(locations.map(location => _api.removeAsset(location)))
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
    _targetStorage.assertSafeLocation(dstLocation)
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

  protected async _saveAssetDataMap(): Promise<void> {
    const data: IAssetDataMap = await this._api.dumpAssetDataMap()
    await this._saveAsset(this._dataMapUri, AssetDataType.JSON, data, undefined)
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
