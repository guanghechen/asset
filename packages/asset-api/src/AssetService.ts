import { AssetChangeEvent } from '@guanghechen/asset-types'
import type {
  IAssetDataMap,
  IAssetResolver,
  IAssetResolverApi,
  IAssetService,
  IAssetSourceStorage,
  IAssetTargetStorage,
  IAssetUrlPrefixResolver,
  IRawAssetServiceConfig,
} from '@guanghechen/asset-types'
import { delay } from '@guanghechen/asset-util'
import invariant from '@guanghechen/invariant'
import type { IReporter } from '@guanghechen/scheduler'
import { AssetResolverApi } from './AssetResolverApi'
import { AssetTaskScheduler } from './AssetTaskScheduler'
import type { IAssetTaskScheduler } from './types'

export interface IAssetServiceConfig {
  GUID_NAMESPACE: string
  api: IAssetResolverApi
  scheduler: IAssetTaskScheduler
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
  assetPatterns?: string[]
  resolveUrlPathPrefix: IAssetUrlPrefixResolver
}

export class AssetService implements IAssetService {
  protected readonly resolver: IAssetResolver
  protected readonly targetStorage: IAssetTargetStorage
  protected readonly reporter: IReporter | undefined
  protected readonly assetResolverConfigs: IAssetServiceConfig[]
  protected readonly assetDataMapFilepath: string
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

    const { resolver, targetStorage, reporter, delayAfterContentChanged, resolveUrlPathPrefix } =
      this
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
    })

    const scheduler = new AssetTaskScheduler({
      api,
      resolver,
      reporter,
      delayAfterContentChanged,
    })
    this.assetResolverConfigs.push({
      GUID_NAMESPACE,
      api,
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
      for (const { sourceStorage, scheduler, acceptedPattern } of assetResolverConfigs) {
        sourceStorage.watch(acceptedPattern, {
          onAdd: filepath => {
            scheduler.schedule({
              type: AssetChangeEvent.CREATED,
              alive: true,
              payload: { location: filepath },
            })
          },
          onChange: filepath => {
            scheduler.schedule({
              type: AssetChangeEvent.MODIFIED,
              alive: true,
              payload: { location: filepath },
            })
          },
          onUnlink: filepath => {
            scheduler.schedule({
              type: AssetChangeEvent.REMOVED,
              alive: true,
              payload: { location: filepath },
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
    await Promise.allSettled(
      this.assetResolverConfigs.map(resolver =>
        resolver.scheduler.finish().then(() => resolver.scheduler.cleanup()),
      ),
    )
  }

  protected async dumpAssetDataMap(api: IAssetResolverApi): Promise<void> {
    const { resolver } = this
    const assetDataMap: IAssetDataMap = resolver.dump()
    await api.saveAssetDataMap(assetDataMap)
  }
}
