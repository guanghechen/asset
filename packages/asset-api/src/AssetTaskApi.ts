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
import type { IReporter } from '@guanghechen/reporter'

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

    const settledTasks: Array<PromiseSettledResult<void>> = await Promise.allSettled(tasks)
    const failure: PromiseRejectedResult | undefined = settledTasks.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    )
    if (failure) {
      const cleanupTasks: Array<Promise<void>> = results.map(result =>
        resolverApi.locator.removeAsset(result.absoluteSrcPath),
      )
      for (const result of results) {
        if (result.data !== null)
          cleanupTasks.push(this._targetStorage.removeFile(result.asset.uri))
      }

      const cleanupResults: Array<PromiseSettledResult<void>> =
        await Promise.allSettled(cleanupTasks)
      const cleanupErrors: unknown[] = cleanupResults.flatMap(result =>
        result.status === 'rejected' ? [result.reason] : [],
      )
      if (cleanupErrors.length > 0) {
        throw new AggregateError(
          [failure.reason, ...cleanupErrors],
          '[AssetTaskApi.create] target write and cleanup failed',
          { cause: failure.reason },
        )
      }
      throw failure.reason
    }
    if (results.length > 0) await this._saveAssetDataMap()
  }

  public async remove(absoluteSrcPaths: ReadonlyArray<string>): Promise<void> {
    const reporter: IReporter = this._reporter
    const resolverApi: IAssetResolverApi = this._resolverApi
    const tasks: Array<Promise<void>> = []

    for (const absoluteSrcPath of absoluteSrcPaths) {
      const asset: IAsset | null = await resolverApi.locator.findAssetBySrcPath(absoluteSrcPath)
      tasks.push(resolverApi.locator.removeAsset(absoluteSrcPath))
      if (asset) {
        reporter.debug('[AssetTasApi.remove] uri({})', asset.uri)
        tasks.push(this._targetStorage.removeFile(asset.uri))
      }
    }
    await Promise.all(tasks)
    if (tasks.length > 0) await this._saveAssetDataMap()
  }

  public async update(absoluteSrcPaths: ReadonlyArray<string>): Promise<void> {
    // Invalidate first; a failed rebuild leaves the asset removed.
    await this.remove(absoluteSrcPaths)
    await this.create(absoluteSrcPaths)
  }

  protected async _saveAsset(item: ITargetItem): Promise<void> {
    if (item.data === null) return

    const reporter: IReporter = this._reporter
    const uri: string = this._targetStorage.resolveUriFromTargetItem(item)
    reporter.debug('[AssetTasApi._saveAsset] uri: {}', uri)

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
