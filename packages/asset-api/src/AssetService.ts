import { AssetChangeEvent } from '@guanghechen/asset-types'
import type {
  IAssetDataMap,
  IAssetResolver,
  IAssetResolverApi,
  IAssetSaveOptions,
  IAssetService,
  IAssetSourceStorage,
  IAssetTargetStorage,
  IAssetUrlPrefixResolver,
  IRawAssetServiceConfig,
} from '@guanghechen/asset-types'
import { delay } from '@guanghechen/asset-util'
import invariant from '@guanghechen/invariant'
import type { IReporter, IScheduler } from '@guanghechen/scheduler'
import { SequentialScheduler } from '@guanghechen/scheduler'
import { AssetChangePipeline } from './AssetChangePipeline'
import { AssetResolverApi } from './AssetResolverApi'
import type { IAssetChangeTaskPipeline } from './types'

export interface IAssetServiceConfig {
  GUID_NAMESPACE: string
  api: IAssetResolverApi
  pipeline: IAssetChangeTaskPipeline
  scheduler: IScheduler
  sourceStorage: IAssetSourceStorage
  acceptedPattern: string[]
}

export interface IAssetServiceProps {
  resolver: IAssetResolver
  targetStorage: IAssetTargetStorage
  reporter?: IReporter
  delayAfterContentChanged?: number // Wait a few million seconds after file content changed.
  assetDataMapFilepath?: string
  defaultAcceptedPattern?: string[]
  caseSensitive?: boolean
  saveOptions?: Partial<IAssetSaveOptions>
  assetPatterns?: string[]
  resolveUrlPathPrefix: IAssetUrlPrefixResolver
}

export class AssetService implements IAssetService {
  protected readonly resolver: IAssetResolver
  protected readonly targetStorage: IAssetTargetStorage
  protected readonly reporter: IReporter | undefined
  protected readonly assetResolverConfigs: IAssetServiceConfig[]
  protected readonly assetDataMapFilepath: string
  protected readonly saveOptions: Partial<IAssetSaveOptions>
  protected readonly defaultAcceptedPattern: string[]
  protected readonly defaultCaseSensitive: boolean
  protected readonly delayAfterContentChanged: number
  protected readonly resolveUrlPathPrefix: IAssetUrlPrefixResolver
  protected _runningTick: number
  protected _isWatching: boolean

  constructor(props: IAssetServiceProps) {
    const { resolver, targetStorage, reporter, assetDataMapFilepath = 'asset.map.json' } = props

    this.resolver = resolver
    this.targetStorage = targetStorage
    this.reporter = reporter
    this.assetResolverConfigs = []
    this.assetDataMapFilepath = targetStorage.resolve(assetDataMapFilepath)
    this.saveOptions = { ...props.saveOptions }
    this.defaultAcceptedPattern = props.defaultAcceptedPattern?.slice() ?? ['**/*', '!.gitkeep']
    this.defaultCaseSensitive = props.caseSensitive ?? true
    this.delayAfterContentChanged = props.delayAfterContentChanged ?? 200
    this.resolveUrlPathPrefix = props.resolveUrlPathPrefix
    this._runningTick = 0
    this._isWatching = false
  }

  public registerAsset(assetConfig: IRawAssetServiceConfig): this {
    invariant(
      this._runningTick === 0,
      `[${this.constructor.name}] Don't add new AssetResolverApi while the service is running.`,
    )

    const {
      resolver,
      targetStorage,
      reporter,
      delayAfterContentChanged,
      saveOptions,
      resolveUrlPathPrefix,
    } = this
    const {
      GUID_NAMESPACE,
      sourceStorage,
      acceptedPattern = this.defaultAcceptedPattern.slice(),
      caseSensitive = this.defaultCaseSensitive,
    } = assetConfig

    const api = new AssetResolverApi({
      GUID_NAMESPACE,
      sourceStorage,
      targetStorage,
      resolveUrlPathPrefix,
      caseSensitive,
      assetDataMapFilepath: this.assetDataMapFilepath,
      saveOptions,
    })

    const pipeline = new AssetChangePipeline({ api, resolver, delayAfterContentChanged })
    const scheduler = new SequentialScheduler({ reporter, pipeline })
    this.assetResolverConfigs.push({
      GUID_NAMESPACE,
      api,
      pipeline,
      scheduler,
      sourceStorage,
      acceptedPattern,
    })
    return this
  }

  public async build(): Promise<void> {
    this._runningTick += 1
    const { resolver, assetResolverConfigs } = this
    try {
      for (const { api, sourceStorage, acceptedPattern } of assetResolverConfigs) {
        const locations = await sourceStorage.collectAssetLocations(acceptedPattern, {
          absolute: true,
        })
        await resolver.create(api, locations)
        await this.dumpAssetDataMap(api)
      }
    } finally {
      this._runningTick -= 1
    }
  }

  public async watch(): Promise<void> {
    if (this._isWatching) return
    this._runningTick += 1
    this._isWatching = true

    try {
      const { assetResolverConfigs } = this
      for (const { sourceStorage, pipeline, acceptedPattern } of assetResolverConfigs) {
        sourceStorage.watch(acceptedPattern, {
          onAdd: filepath => {
            pipeline.push({
              type: AssetChangeEvent.CREATED,
              payload: { locations: [filepath] },
            })
          },
          onChange: filepath => {
            pipeline.push({
              type: AssetChangeEvent.MODIFIED,
              payload: { locations: [filepath] },
            })
          },
          onUnlink: filepath => {
            pipeline.push({
              type: AssetChangeEvent.REMOVED,
              payload: { locations: [filepath] },
            })
          },
        })
      }

      await delay(500)
      await Promise.allSettled(assetResolverConfigs.map(resolver => resolver.scheduler.start()))
    } finally {
      this._runningTick -= 1
      this._isWatching = false
    }
  }

  public async stopWatch(): Promise<void> {
    if (!this._isWatching) return
    await Promise.allSettled(this.assetResolverConfigs.map(resolver => resolver.pipeline.close()))
    await Promise.allSettled(
      this.assetResolverConfigs.map(resolver => resolver.scheduler.waitDrain()),
    )
  }

  protected async dumpAssetDataMap(api: IAssetResolverApi): Promise<void> {
    const { resolver } = this
    const assetDataMap: IAssetDataMap = resolver.dump()
    await api.saveAssetDataMap(assetDataMap)
  }
}
