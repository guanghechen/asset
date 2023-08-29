import type { IAssetTaskScheduler } from '@guanghechen/asset-api'
import type { IAssetResolverApi } from './asset-resolver-api'
import type { IAssetSourceStorage } from './asset-storage'

export interface IRawAssetServiceConfig {
  GUID_NAMESPACE: string
  sourceStorage: IAssetSourceStorage
  acceptedPattern?: string[]
  caseSensitive?: boolean
}

export interface IAssetServiceConfig {
  GUID_NAMESPACE: string
  api: IAssetResolverApi
  scheduler: IAssetTaskScheduler
  sourceStorage: IAssetSourceStorage
  acceptedPattern: string[]
}

export interface IAssetServiceWatcher {
  unwatch(): Promise<void>
}

export interface IAssetServiceConfigManager {
  readonly configs: IAssetServiceConfig[]
  register(assetConfig: IRawAssetServiceConfig): this
}

export interface IAssetService {
  build(configs: IAssetServiceConfig[]): Promise<void>
  watch(configs: IAssetServiceConfig[]): Promise<IAssetServiceWatcher>
}
