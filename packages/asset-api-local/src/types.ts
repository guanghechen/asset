import type { IAssetChangeTaskPipeline } from '@guanghechen/asset-api'
import type { IAssetResolverApi } from '@guanghechen/asset-types'
import type { IScheduler } from '@guanghechen/scheduler'

export interface IRawAssetConfig {
  GUID_NAMESPACE: string
  sourceRoot: string
  acceptedPattern?: string[]
  caseSensitive?: boolean
}

export interface IRawAssetConfigGroup {
  configs: IRawAssetConfig[]
  assetDataMapFilepath?: string
}

export interface IAssetConfig {
  GUID_NAMESPACE: string
  api: IAssetResolverApi
  pipeline: IAssetChangeTaskPipeline
  scheduler: IScheduler
  sourceRoot: string
  acceptedPattern: string[]
}

export type IAssetUrlPrefixResolver = (params: { assetType: string; mimetype: string }) => string
