import type { IAssetResolverApi } from './asset-resolver-api'
import type { IAssetSourceStorage } from './asset-storage'
import type { IAssetServiceWatcher } from './common'

export interface IRawAssetServiceConfig {
  GUID_NAMESPACE: string
  sourceStorage: IAssetSourceStorage
  acceptedPattern?: string[]
  caseSensitive?: boolean
}

export interface IAssetServiceConfig {
  GUID_NAMESPACE: string
  api: IAssetResolverApi
  sourceStorage: IAssetSourceStorage
  acceptedPattern: string[]
}

export interface IAssetServiceConfigManager {
  readonly configs: IAssetServiceConfig[]
  register(assetConfig: IRawAssetServiceConfig): this
}

export interface IAssetService {
  build(configs: Iterable<IAssetServiceConfig>): Promise<void>
  watch(configs: Iterable<IAssetServiceConfig>): Promise<IAssetServiceWatcher>
}
