import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import type {
  IAsset,
  IAssetDataMap,
  IAssetResolvedData,
  IAssetResolver,
  IAssetResolverApi,
  IAssetTargetStorage,
  IAssetTaskApi,
  IBinaryFileData,
  IJsonFileData,
  IRawBinaryTargetItem,
  IRawJsonTargetItem,
  IRawTextTargetItem,
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
  protected readonly _resolverApi: IAssetResolverApi
  protected readonly _resolver: IAssetResolver
  protected readonly _reporter: IReporter
  protected readonly _targetStorage: IAssetTargetStorage
  protected readonly _dataMapUri: string

  constructor(props: IProps) {
    this._resolverApi = props.api
    this._resolver = props.resolver
    this._reporter = props.reporter
    this._targetStorage = props.targetStorage
    this._dataMapUri = props.dataMapUri
  }

  public async create(srcPaths: string[]): Promise<void> {
    const resolverApi: IAssetResolverApi = this._resolverApi
    const resolver: IAssetResolver = this._resolver
    const results: IAssetResolvedData[] = await resolver.resolve(srcPaths, resolverApi)
    const tasks: Array<Promise<void>> = []

    for (const result of results) {
      const { asset, sourcetype, datatype, data, encoding } = result
      const task: Promise<void> = this._saveAsset({
        uri: asset.uri,
        sourcetype,
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
    const resolverApi: IAssetResolverApi = this._resolverApi
    const tasks: Array<Promise<void>> = []

    for (const srcPath of srcPaths) {
      const asset: IAsset | undefined = await resolverApi.locateAsset(srcPath)
      tasks.push(resolverApi.removeAsset(srcPath))
      if (asset) {
        this._reporter.verbose('[AssetTasApi.remove] uri({})', asset.uri)
        tasks.push(this._targetStorage.removeFile(asset.uri))
      }
    }
    if (tasks.length > 0) tasks.push(this._saveAssetDataMap())

    await Promise.all(tasks)
  }

  public async update(srcPaths: string[]): Promise<void> {
    const resolverApi: IAssetResolverApi = this._resolverApi
    await Promise.all(srcPaths.map(srcPath => resolverApi.removeAsset(srcPath)))
    await this.create(srcPaths)
  }

  protected async _saveAsset(params: {
    uri: string
    sourcetype: string
    mimetype: string
    datatype: AssetDataTypeEnum
    data: unknown
    encoding: BufferEncoding | undefined
  }): Promise<void> {
    if (params.data === null) return

    const { uri, sourcetype, mimetype, datatype, data, encoding } = params
    this._reporter.verbose('[AssetTasApi._saveAsset] uri: {}', uri)

    const targetStorage: IAssetTargetStorage = this._targetStorage
    switch (datatype) {
      case AssetDataTypeEnum.BINARY: {
        const rawItem: IRawBinaryTargetItem = {
          uri,
          sourcetype,
          mimetype,
          datatype,
          data: data as IBinaryFileData,
        }
        await targetStorage.writeFile(rawItem)
        break
      }
      case AssetDataTypeEnum.JSON: {
        const rawItem: IRawJsonTargetItem = {
          uri,
          sourcetype,
          datatype,
          mimetype,
          data: data as IJsonFileData,
        }
        await targetStorage.writeFile(rawItem)
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

        const rawItem: IRawTextTargetItem = {
          uri,
          sourcetype,
          mimetype,
          datatype,
          data: data as ITextFileData,
          encoding,
        }
        await targetStorage.writeFile(rawItem)
        break
      }
      default:
        throw new Error(`[AssetTaskApi._saveAsset] Unexpected datatype: ${datatype}`)
    }
  }

  protected async _saveAssetDataMap(): Promise<void> {
    const data: IAssetDataMap = await this._resolverApi.dumpAssetDataMap()
    await this._saveAsset({
      uri: this._dataMapUri,
      sourcetype: 'asset-map',
      mimetype: 'application/json',
      datatype: AssetDataTypeEnum.JSON,
      data,
      encoding: undefined,
    })
  }
}
