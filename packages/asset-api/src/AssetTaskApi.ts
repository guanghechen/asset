import { AssetDataTypeEnum } from '@guanghechen/asset-types'
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

  public async create(srcPaths: string[]): Promise<void> {
    const { _resolver, _api } = this
    const results = await _resolver.resolve(srcPaths, _api)
    const tasks: Array<Promise<void>> = []

    for (const result of results) {
      const { asset, datatype, data, encoding } = result
      tasks.push(
        this._saveAsset({
          uri: asset.uri,
          mimetype: asset.mimetype,
          datatype,
          data,
          encoding,
        }),
      )
    }

    if (tasks.length > 0) tasks.push(this._saveAssetDataMap())

    await Promise.all(tasks)
  }

  public async remove(srcPaths: string[]): Promise<void> {
    const { _api } = this
    const tasks: Array<Promise<void>> = []

    for (const srcPath of srcPaths) {
      const asset = await _api.locateAsset(srcPath)
      tasks.push(_api.removeAsset(srcPath))
      if (asset) tasks.push(this._removeAsset(asset.uri))
    }

    if (tasks.length > 0) tasks.push(this._saveAssetDataMap())

    await Promise.all(tasks)
  }

  public async update(srcPaths: string[]): Promise<void> {
    const { _api } = this
    await Promise.all(srcPaths.map(srcPath => _api.removeAsset(srcPath)))
    await this.create(srcPaths)
  }

  protected async _saveAsset(params: {
    uri: string
    mimetype: string
    datatype: AssetDataTypeEnum
    data: unknown | null
    encoding: BufferEncoding | undefined
  }): Promise<void> {
    if (params.data === null) return

    const { uri, mimetype, data, datatype, encoding } = params
    this._reporter.verbose('[saveAsset] uri: {}', uri)

    const { _targetStorage } = this
    switch (datatype) {
      case AssetDataTypeEnum.BINARY:
        await _targetStorage.writeBinaryFile(uri, mimetype, data as IBinaryLike)
        break
      case AssetDataTypeEnum.JSON: {
        await _targetStorage.writeJsonFile(uri, mimetype, data)
        break
      }
      case AssetDataTypeEnum.TEXT:
        invariant(
          !!encoding,
          `[${this.constructor.name}.saveAsset] encoding is required for text type file`,
        )
        await _targetStorage.writeTextFile(uri, mimetype, data as string, encoding)
        break
      default:
        throw new Error(`[${this.constructor.name}.saveAsset] Unexpected datatype: ${datatype}`)
    }
  }

  protected async _saveAssetDataMap(): Promise<void> {
    const data: IAssetDataMap = await this._api.dumpAssetDataMap()
    await this._saveAsset({
      uri: this._dataMapUri,
      mimetype: 'application/json',
      datatype: AssetDataTypeEnum.JSON,
      data,
      encoding: undefined,
    })
  }

  protected async _removeAsset(uri: string): Promise<void> {
    this._reporter.verbose('[removeAsset] uri({})', uri)
    await this._targetStorage.removeFile(uri)
  }
}
