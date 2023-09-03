import { AssetResolverApi } from '@guanghechen/asset-resolver'
import type {
  IAssetResolver,
  IAssetServiceConfig,
  IAssetServiceConfigManager,
  IAssetTargetStorage,
  IAssetUrlPrefixResolver,
  IRawAssetServiceConfig,
} from '@guanghechen/asset-types'
import type { IReporter } from '@guanghechen/types'
import { AssetResolverLocator } from './AssetResolverLocator'
import { AssetTaskApi } from './AssetTaskApi'

export interface IAssetServiceConfigManagerProps {
  reporter: IReporter
  resolver: IAssetResolver
  targetStorage: IAssetTargetStorage
  defaultAcceptedPattern?: string[]
  resolveUrlPathPrefix: IAssetUrlPrefixResolver
}

export class AssetServiceConfigManager implements IAssetServiceConfigManager {
  protected readonly _configs: IAssetServiceConfig[]
  protected readonly _reporter: IReporter
  protected readonly _resolver: IAssetResolver
  protected readonly _targetStorage: IAssetTargetStorage
  protected readonly _defaultAcceptedPattern: string[]
  protected readonly _resolveUrlPathPrefix: IAssetUrlPrefixResolver

  constructor(props: IAssetServiceConfigManagerProps) {
    const {
      reporter,
      resolver,
      targetStorage,
      defaultAcceptedPattern = ['**/*', '!.gitkeep'],
      resolveUrlPathPrefix,
    } = props

    this._configs = []
    this._reporter = reporter
    this._resolver = resolver
    this._targetStorage = targetStorage
    this._defaultAcceptedPattern = defaultAcceptedPattern
    this._resolveUrlPathPrefix = resolveUrlPathPrefix
  }

  public get configs(): IAssetServiceConfig[] {
    return this._configs.slice()
  }

  public register(assetConfig: IRawAssetServiceConfig): this {
    const { _reporter, _resolver, _targetStorage, _defaultAcceptedPattern, _resolveUrlPathPrefix } =
      this
    const {
      GUID_NAMESPACE,
      assetManager,
      dataMapUri,
      sourceStorage,
      acceptedPattern = _defaultAcceptedPattern,
      delayAfterContentChanged,
    } = assetConfig

    const locator = new AssetResolverLocator({ assetManager })
    const resolverApi = new AssetResolverApi({
      GUID_NAMESPACE,
      sourceStorage,
      resolveUrlPathPrefix: _resolveUrlPathPrefix,
    })

    const api = new AssetTaskApi({
      api: resolverApi,
      manager: assetManager,
      locator,
      resolver: _resolver,
      reporter: _reporter,
      sourceStorage,
      targetStorage: _targetStorage,
      dataMapUri,
      delayAfterContentChanged,
    })

    this._configs.push({ api, sourceStorage, acceptedPattern: acceptedPattern.slice() })
    return this
  }
}
