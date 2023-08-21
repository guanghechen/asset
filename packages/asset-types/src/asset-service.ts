import type { IAssetSourceStorage } from './asset-storage'

export interface IRawAssetServiceConfig {
  GUID_NAMESPACE: string
  sourceStorage: IAssetSourceStorage
  acceptedPattern?: string[]
  caseSensitive?: boolean
}

export interface IAssetService {
  registerAsset(assetConfig: IRawAssetServiceConfig): this
  build(): Promise<void>
  watch(): Promise<void>
}
