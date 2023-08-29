import type {
  IAssetResolver,
  IAssetServiceConfig,
  IAssetServiceConfigManager,
  IAssetTargetStorage,
  IAssetUrlPrefixResolver,
  IRawAssetServiceConfig,
} from '@guanghechen/asset-types'
import type { IReporter } from '@guanghechen/scheduler'
import { AssetResolverApi } from './AssetResolverApi'
import { AssetTaskScheduler } from './AssetTaskScheduler'

export interface IAssetServiceConfigManagerProps {
  resolver: IAssetResolver
  targetStorage: IAssetTargetStorage
  reporter?: IReporter
  delayAfterContentChanged?: number // Wait a few million seconds after file content changed.
  assetDataMapFilepath?: string
  defaultAcceptedPattern?: string[]
  caseSensitive?: boolean
  assetPatterns?: string[]
  resolveUrlPathPrefix: IAssetUrlPrefixResolver
}

export class AssetServiceConfigManager implements IAssetServiceConfigManager {
  protected readonly _configs: IAssetServiceConfig[]
  protected readonly _resolver: IAssetResolver
  protected readonly _targetStorage: IAssetTargetStorage
  protected readonly _reporter: IReporter | undefined
  protected readonly _assetDataMapFilepath: string
  protected readonly _defaultAcceptedPattern: string[]
  protected readonly _defaultCaseSensitive: boolean
  protected readonly _delayAfterContentChanged: number
  protected readonly _resolveUrlPathPrefix: IAssetUrlPrefixResolver

  constructor(props: IAssetServiceConfigManagerProps) {
    const { resolver, targetStorage, reporter, assetDataMapFilepath = 'asset.map.json' } = props

    this._resolver = resolver
    this._targetStorage = targetStorage
    this._reporter = reporter
    this._configs = []
    this._assetDataMapFilepath = targetStorage.absolute(assetDataMapFilepath)
    this._defaultAcceptedPattern = props.defaultAcceptedPattern?.slice() ?? ['**/*', '!.gitkeep']
    this._defaultCaseSensitive = props.caseSensitive ?? true
    this._delayAfterContentChanged = props.delayAfterContentChanged ?? 200
    this._resolveUrlPathPrefix = props.resolveUrlPathPrefix
  }

  public get configs(): IAssetServiceConfig[] {
    return this._configs.slice()
  }

  public register(assetConfig: IRawAssetServiceConfig): this {
    const {
      _resolver,
      _targetStorage,
      _reporter,
      _delayAfterContentChanged,
      _resolveUrlPathPrefix,
    } = this
    const {
      GUID_NAMESPACE,
      sourceStorage,
      acceptedPattern = this._defaultAcceptedPattern.slice(),
      caseSensitive = this._defaultCaseSensitive,
    } = assetConfig

    const api = new AssetResolverApi({
      GUID_NAMESPACE,
      sourceStorage,
      targetStorage: _targetStorage,
      caseSensitive,
      assetDataMapFilepath: this._assetDataMapFilepath,
      resolveUrlPathPrefix: _resolveUrlPathPrefix,
    })

    const scheduler = new AssetTaskScheduler({
      api,
      resolver: _resolver,
      reporter: _reporter,
      delayAfterContentChanged: _delayAfterContentChanged,
    })

    this._configs.push({
      GUID_NAMESPACE,
      api,
      scheduler,
      sourceStorage,
      acceptedPattern,
    })
    return this
  }
}
