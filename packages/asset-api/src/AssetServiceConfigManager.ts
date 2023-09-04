import type {
  IAssetResolver,
  IAssetServiceConfig,
  IAssetServiceConfigManager,
  IAssetTargetStorage,
  IRawAssetServiceConfig,
} from '@guanghechen/asset-types'
import type { IReporter } from '@guanghechen/types'
import { AssetTaskApi } from './AssetTaskApi'

export interface IAssetServiceConfigManagerProps {
  reporter: IReporter
  resolver: IAssetResolver
  targetStorage: IAssetTargetStorage
  defaultAcceptedPattern?: string[]
}

export class AssetServiceConfigManager implements IAssetServiceConfigManager {
  protected readonly _configs: IAssetServiceConfig[]
  protected readonly _reporter: IReporter
  protected readonly _resolver: IAssetResolver
  protected readonly _targetStorage: IAssetTargetStorage
  protected readonly _defaultAcceptedPattern: string[]

  constructor(props: IAssetServiceConfigManagerProps) {
    const {
      reporter,
      resolver,
      targetStorage,
      defaultAcceptedPattern = ['**/*', '!.gitkeep'],
    } = props

    this._configs = []
    this._reporter = reporter
    this._resolver = resolver
    this._targetStorage = targetStorage
    this._defaultAcceptedPattern = defaultAcceptedPattern
  }

  public get configs(): IAssetServiceConfig[] {
    return this._configs.slice()
  }

  public register(assetConfig: IRawAssetServiceConfig): this {
    const { _reporter, _resolver, _targetStorage, _defaultAcceptedPattern } = this
    const {
      api: resolverApi,
      sourceStorage,
      dataMapUri,
      acceptedPattern = _defaultAcceptedPattern,
      delayAfterContentChanged,
    } = assetConfig

    const api = new AssetTaskApi({
      api: resolverApi,
      resolver: _resolver,
      reporter: _reporter,
      targetStorage: _targetStorage,
      dataMapUri,
      delayAfterContentChanged,
    })

    this._configs.push({ api, sourceStorage, acceptedPattern: acceptedPattern.slice() })
    return this
  }
}
