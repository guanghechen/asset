import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import type {
  IAssetDataMap,
  IAssetResolver,
  IAssetResolverApi,
  IAssetTargetStorage,
  IAssetTaskApi,
  IBinaryFileData,
  IJsonFileData,
  IRawBinaryFileItem,
  IRawJsonFileItem,
  IRawTextFileItem,
  ITextFileData,
} from '@guanghechen/asset-types'
import type { IReporter } from '@guanghechen/types'

interface IProps {
  api: IAssetResolverApi
  resolver: IAssetResolver
  reporter: IReporter
  targetStorage: IAssetTargetStorage
  dataMapUri: string
}

export class AssetTaskApi implements IAssetTaskApi {
  protected readonly _api: IAssetResolverApi
  protected readonly _resolver: IAssetResolver
  protected readonly _reporter: IReporter
  protected readonly _targetStorage: IAssetTargetStorage
  protected readonly _dataMapUri: string

  constructor(props: IProps) {
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
      const task: Promise<void> = this._saveAsset({
        uri: asset.uri,
        mimetype: asset.mimetype,
        datatype,
        data,
        encoding,
      })
      tasks.push(task)
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
      if (asset) {
        this._reporter.verbose('[AssetTasApi.remove] uri({})', asset.uri)
        const task: Promise<void> = this._targetStorage.removeFile(asset.uri)
        tasks.push(task)
      }
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
    data: unknown
    encoding: BufferEncoding | undefined
  }): Promise<void> {
    if (params.data === null) return

    const { uri, mimetype, data, datatype, encoding } = params
    this._reporter.verbose('[AssetTasApi._saveAsset] uri: {}', uri)

    const { _targetStorage } = this
    switch (datatype) {
      case AssetDataTypeEnum.BINARY: {
        const rawItem: IRawBinaryFileItem = {
          datatype,
          mimetype,
          uri,
          data: data as IBinaryFileData,
        }
        await _targetStorage.writeFile(rawItem)
        break
      }
      case AssetDataTypeEnum.JSON: {
        const rawItem: IRawJsonFileItem = {
          datatype,
          mimetype,
          uri,
          data: data as IJsonFileData,
        }
        await _targetStorage.writeFile(rawItem)
        break
      }
      case AssetDataTypeEnum.TEXT: {
        if (!encoding) {
          this._reporter.error(
            `[AssetTasApi._saveAsset] encoding is required for text type file`,
            params,
          )
          throw new Error('[AssetTasApi] encoding is required for text type file')
        }

        const rawItem: IRawTextFileItem = {
          datatype,
          mimetype,
          uri,
          data: data as ITextFileData,
          encoding,
        }
        await _targetStorage.writeFile(rawItem)
        break
      }
      default:
        throw new Error(`[AssetTaskApi._saveAsset] Unexpected datatype: ${datatype}`)
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
}
