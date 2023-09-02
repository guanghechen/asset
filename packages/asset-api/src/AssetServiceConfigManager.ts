import type {
  IAssetServiceConfig,
  IAssetServiceConfigManager,
  IAssetTargetStorage,
  IAssetUrlPrefixResolver,
  IRawAssetServiceConfig,
} from '@guanghechen/asset-types'
import type { IReporter } from '@guanghechen/types'
import { AssetResolverApi } from './AssetResolverApi'

export interface IAssetServiceConfigManagerProps {
  reporter: IReporter
  targetStorage: IAssetTargetStorage
  dataMapUri: string
  defaultAcceptedPattern?: string[]
  resolveUrlPathPrefix: IAssetUrlPrefixResolver
}

export class AssetServiceConfigManager implements IAssetServiceConfigManager {
  protected readonly _configs: IAssetServiceConfig[]
  protected readonly _reporter: IReporter
  protected readonly _targetStorage: IAssetTargetStorage
  protected readonly _dataMapUri: string
  protected readonly _defaultAcceptedPattern: string[]
  protected readonly _resolveUrlPathPrefix: IAssetUrlPrefixResolver

  constructor(props: IAssetServiceConfigManagerProps) {
    const {
      reporter,
      targetStorage,
      dataMapUri,
      defaultAcceptedPattern = ['**/*', '!.gitkeep'],
      resolveUrlPathPrefix,
    } = props

    this._configs = []
    this._reporter = reporter
    this._targetStorage = targetStorage
    this._dataMapUri = dataMapUri
    this._defaultAcceptedPattern = defaultAcceptedPattern
    this._resolveUrlPathPrefix = resolveUrlPathPrefix
  }

  public get configs(): IAssetServiceConfig[] {
    return this._configs.slice()
  }

  public register(assetConfig: IRawAssetServiceConfig): this {
    const {
      _reporter,
      _targetStorage,
      _dataMapUri,
      _defaultAcceptedPattern,
      _resolveUrlPathPrefix,
    } = this
    const { GUID_NAMESPACE, sourceStorage, acceptedPattern = _defaultAcceptedPattern } = assetConfig

    const api = new AssetResolverApi({
      GUID_NAMESPACE,
      sourceStorage,
      targetStorage: _targetStorage,
      dataMapUri: _dataMapUri,
      reporter: _reporter,
      resolveUrlPathPrefix: _resolveUrlPathPrefix,
    })

    this._configs.push({ api, sourceStorage, acceptedPattern: acceptedPattern.slice() })
    return this
  }
}
