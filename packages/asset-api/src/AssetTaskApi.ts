import { AssetDataTypeEnum } from '@guanghechen/asset-types'
import type {
  IAsset,
  IAssetDataMap,
  IAssetProcessedData,
  IAssetResolver,
  IAssetResolverApi,
  IAssetTargetStorage,
  IAssetTaskApi,
  IBinaryFileData,
  IJsonFileData,
  ITargetItem,
} from '@guanghechen/asset-types'
import type { IReporter } from '@guanghechen/reporter.types'

interface IProps {
  resolver: IAssetResolver
  resolverApi: IAssetResolverApi
  reporter: IReporter
  targetStorage: IAssetTargetStorage
  dataMapUri: string
}

export class AssetTaskApi implements IAssetTaskApi {
  protected readonly _resolver: IAssetResolver
  protected readonly _resolverApi: IAssetResolverApi
  protected readonly _reporter: IReporter
  protected readonly _targetStorage: IAssetTargetStorage
  protected readonly _dataMapUri: string

  constructor(props: IProps) {
    this._resolverApi = props.resolverApi
    this._resolver = props.resolver
    this._reporter = props.reporter
    this._targetStorage = props.targetStorage
    this._dataMapUri = props.dataMapUri
  }

  public async resolve(absoluteSrcPath: string): Promise<IAsset | null> {
    const resolverApi: IAssetResolverApi = this._resolverApi
    const resolver: IAssetResolver = this._resolver
    const asset: IAsset | null = await resolver.resolve(absoluteSrcPath, resolverApi)
    return asset
  }

  public async create(absoluteSrcPaths: ReadonlyArray<string>): Promise<void> {
    const resolverApi: IAssetResolverApi = this._resolverApi
    const resolver: IAssetResolver = this._resolver
    const results: IAssetProcessedData[] = await resolver.process(absoluteSrcPaths, resolverApi)
    const tasks: Array<Promise<void>> = []

    for (const result of results) {
      const { asset, data, datatype } = result
      switch (datatype) {
        case AssetDataTypeEnum.BINARY: {
          const item: ITargetItem = {
            datatype: AssetDataTypeEnum.BINARY,
            asset,
            data: data as IBinaryFileData,
          }
          tasks.push(this._saveAsset(item))
          break
        }
        case AssetDataTypeEnum.TEXT: {
          const item: ITargetItem = {
            datatype: AssetDataTypeEnum.TEXT,
            asset,
            data: data as string,
            encoding: result.encoding as BufferEncoding,
          }
          tasks.push(this._saveAsset(item))
          break
        }
        case AssetDataTypeEnum.JSON: {
          const item: ITargetItem = {
            datatype: AssetDataTypeEnum.JSON,
            asset,
            data: data as IJsonFileData,
          }
          tasks.push(this._saveAsset(item))
          break
        }
        default:
          throw new TypeError(`[AssetTaskApi.create] Unexpected datatype: ${datatype}`)
      }
    }
    if (tasks.length > 0) tasks.push(this._saveAssetDataMap())

    await Promise.all(tasks)
  }

  public async remove(absoluteSrcPaths: ReadonlyArray<string>): Promise<void> {
    const reporter: IReporter = this._reporter
    const resolverApi: IAssetResolverApi = this._resolverApi
    const tasks: Array<Promise<void>> = []

    for (const absoluteSrcPath of absoluteSrcPaths) {
      const asset: IAsset | null = await resolverApi.locator.findAssetBySrcPath(absoluteSrcPath)
      tasks.push(resolverApi.locator.removeAsset(absoluteSrcPath))
      if (asset) {
        reporter.verbose('[AssetTasApi.remove] uri({})', asset.uri)
        tasks.push(this._targetStorage.removeFile(asset.uri))
      }
    }
    if (tasks.length > 0) tasks.push(this._saveAssetDataMap())

    await Promise.all(tasks)
  }

  public async update(absoluteSrcPath: ReadonlyArray<string>): Promise<void> {
    const resolverApi: IAssetResolverApi = this._resolverApi
    await Promise.all(absoluteSrcPath.map(srcPath => resolverApi.locator.removeAsset(srcPath)))
    await this.create(absoluteSrcPath)
  }

  protected async _saveAsset(item: ITargetItem): Promise<void> {
    if (item.data === null) return

    const reporter: IReporter = this._reporter
    const uri: string = this._targetStorage.resolveUriFromTargetItem(item)
    reporter.verbose('[AssetTasApi._saveAsset] uri: {}', uri)

    // validation
    const { datatype } = item
    switch (datatype) {
      case AssetDataTypeEnum.BINARY:
      case AssetDataTypeEnum.JSON:
      case AssetDataTypeEnum.ASSET_MAP:
        break
      case AssetDataTypeEnum.TEXT: {
        if (!item.encoding) {
          reporter.error('[AssetTasApi._saveAsset] encoding is required for text type file', item)
          throw new Error('[AssetTasApi._saveAsset] encoding is required for text type file')
        }
        break
      }
      default:
        throw new Error(`[AssetTaskApi._saveAsset] Unexpected datatype: ${datatype}`)
    }

    // save
    await this._targetStorage.writeFile(item)
  }

  protected async _saveAssetDataMap(): Promise<void> {
    const data: IAssetDataMap = await this._resolverApi.locator.dumpAssetDataMap()
    await this._saveAsset({
      datatype: AssetDataTypeEnum.ASSET_MAP,
      uri: this._dataMapUri,
      data,
    })
  }
}
