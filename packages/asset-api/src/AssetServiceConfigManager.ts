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
  assetDataMapFilepath?: string
  defaultAcceptedPattern?: string[]
  caseSensitive?: boolean
  resolveUrlPathPrefix: IAssetUrlPrefixResolver
}

export class AssetServiceConfigManager implements IAssetServiceConfigManager {
  protected readonly _reporter: IReporter
  protected readonly _configs: IAssetServiceConfig[]
  protected readonly _targetStorage: IAssetTargetStorage
  protected readonly _assetDataMapFilepath: string
  protected readonly _defaultAcceptedPattern: string[]
  protected readonly _defaultCaseSensitive: boolean
  protected readonly _resolveUrlPathPrefix: IAssetUrlPrefixResolver

  constructor(props: IAssetServiceConfigManagerProps) {
    const { reporter, targetStorage, assetDataMapFilepath = 'asset.map.json' } = props

    this._reporter = reporter
    this._targetStorage = targetStorage
    this._configs = []
    this._assetDataMapFilepath = targetStorage.absolute(assetDataMapFilepath)
    this._defaultAcceptedPattern = props.defaultAcceptedPattern?.slice() ?? ['**/*', '!.gitkeep']
    this._defaultCaseSensitive = props.caseSensitive ?? true
    this._resolveUrlPathPrefix = props.resolveUrlPathPrefix
  }

  public get configs(): IAssetServiceConfig[] {
    return this._configs.slice()
  }

  public register(assetConfig: IRawAssetServiceConfig): this {
    const {
      _reporter,
      _assetDataMapFilepath,
      _targetStorage,
      _defaultAcceptedPattern,
      _defaultCaseSensitive,
      _resolveUrlPathPrefix,
    } = this
    const {
      GUID_NAMESPACE,
      sourceStorage,
      acceptedPattern = _defaultAcceptedPattern,
      caseSensitive = _defaultCaseSensitive,
    } = assetConfig

    const api = new AssetResolverApi({
      GUID_NAMESPACE,
      sourceStorage,
      targetStorage: _targetStorage,
      caseSensitive,
      assetDataMapFilepath: _assetDataMapFilepath,
      reporter: _reporter,
      resolveUrlPathPrefix: _resolveUrlPathPrefix,
    })

    this._configs.push({
      GUID_NAMESPACE,
      api,
      sourceStorage,
      acceptedPattern: acceptedPattern.slice(),
    })
    return this
  }
}
