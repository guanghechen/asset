import type { IAssetResolverApi } from './asset-resolver-api'
import type { IAssetSourceStorage } from './asset-storage'
import type { IAssetTaskApi } from './asset-task-api'
import type { IAssetServiceWatcher } from './common'

export interface IRawAssetServiceConfig {
  api: IAssetResolverApi
  sourceStorage: IAssetSourceStorage
  dataMapUri: string
  acceptedPattern?: string[]
  delayAfterContentChanged?: number
}

export interface IAssetServiceConfig {
  api: IAssetTaskApi
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
