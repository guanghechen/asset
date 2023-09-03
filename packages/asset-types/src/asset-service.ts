import type { IAssetManager } from './asset-manager'
import type { IAssetSourceStorage } from './asset-storage'
import type { IAssetTaskApi } from './asset-task-api'
import type { IAssetServiceWatcher } from './common'

export interface IRawAssetServiceConfig {
  GUID_NAMESPACE: string
  assetManager: IAssetManager
  dataMapUri: string
  sourceStorage: IAssetSourceStorage
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
