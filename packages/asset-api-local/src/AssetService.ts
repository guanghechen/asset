import { delay } from '@guanghechen/asset-api'
import type { IAssetDataMap, IAssetResolver, IAssetResolverApi } from '@guanghechen/asset-types'
import invariant from '@guanghechen/invariant'
import type { IReporter } from '@guanghechen/scheduler'
import { SequentialScheduler } from '@guanghechen/scheduler'
import chokidar from 'chokidar'
import path from 'node:path'
import { AssetChangePipeline } from '../../asset-api/src/pipeline/pipeline'
import { AssetChangeEvent } from '../../asset-api/src/pipeline/types'
import type { ISaveOptions } from './AssetResolverApi'
import { AssetResolverApi } from './AssetResolverApi'
import type { IAssetConfig, IAssetUrlPrefixResolver, IRawAssetConfig } from './types'
import { collectAssetLocations } from './util/location'

export interface IAssetServiceProps {
  resolver: IAssetResolver
  staticRoot: string
  reporter?: IReporter
  // Wait a few million seconds after file content changed.
  delayAfterContentChanged?: number
  assetDataMapFilepath?: string
  defaultAcceptedPattern?: string[]
  caseSensitive?: boolean
  saveOptions?: Partial<ISaveOptions>
  assetPatterns?: string[]
  resolveUrlPathPrefix: IAssetUrlPrefixResolver
}

export class AssetService {
  protected readonly resolver: IAssetResolver
  protected readonly reporter: IReporter | undefined
  protected readonly assetResolverConfigs: IAssetConfig[]
  protected readonly staticRoot: string
  protected readonly assetDataMapFilepath: string
  protected readonly saveOptions: Partial<ISaveOptions>
  protected readonly defaultAcceptedPattern: string[]
  protected readonly defaultCaseSensitive: boolean
  protected readonly delayAfterContentChanged: number
  protected readonly resolveUrlPathPrefix: IAssetUrlPrefixResolver
  protected _runningTick: number
  protected _isWatching: boolean

  constructor(props: IAssetServiceProps) {
    this.resolver = props.resolver
    this.reporter = props.reporter
    this.assetResolverConfigs = []
    this.staticRoot = props.staticRoot
    this.assetDataMapFilepath = path.resolve(
      this.staticRoot,
      props.assetDataMapFilepath ?? 'asset.map.json',
    )
    this.saveOptions = { ...props.saveOptions }
    this.defaultAcceptedPattern = props.defaultAcceptedPattern?.slice() ?? ['**/*', '!.gitkeep']
    this.defaultCaseSensitive = props.caseSensitive ?? true
    this.delayAfterContentChanged = props.delayAfterContentChanged ?? 200
    this.resolveUrlPathPrefix = props.resolveUrlPathPrefix
    this._runningTick = 0
    this._isWatching = false
  }

  public registerAsset(assetConfig: IRawAssetConfig): this {
    invariant(
      this._runningTick === 0,
      `[${this.constructor.name}] Don't add new AssetResolverApi while the service is running.`,
    )

    const { resolver, reporter, delayAfterContentChanged, saveOptions, resolveUrlPathPrefix } = this
    const {
      GUID_NAMESPACE,
      sourceRoot,
      acceptedPattern = this.defaultAcceptedPattern.slice(),
      caseSensitive = this.defaultCaseSensitive,
    } = assetConfig

    const api = new AssetResolverApi({
      GUID_NAMESPACE,
      sourceRoot,
      staticRoot: this.staticRoot,
      resolveUrlPathPrefix,
      caseSensitive,
      assetDataMapFilepath: this.assetDataMapFilepath,
      saveOptions,
    })

    const pipeline = new AssetChangePipeline({ api, resolver, delayAfterContentChanged })
    const scheduler = new SequentialScheduler({ reporter, pipeline })
    this.assetResolverConfigs.push({
      api,
      GUID_NAMESPACE,
      sourceRoot,
      acceptedPattern,
      pipeline,
      scheduler,
    })
    return this
  }

  public async build(): Promise<void> {
    this._runningTick += 1
    const { resolver, assetResolverConfigs } = this
    try {
      for (const { api, sourceRoot, acceptedPattern } of assetResolverConfigs) {
        const locations = await collectAssetLocations(acceptedPattern, {
          cwd: sourceRoot,
          absolute: true,
        })
        await resolver.create(api, locations)
        await this.dumpAssetDataMap(api)
      }
    } finally {
      this._runningTick -= 1
    }
  }

  public async watch(watchOptions?: Partial<chokidar.WatchOptions>): Promise<void> {
    if (this._isWatching) return
    this._runningTick += 1
    this._isWatching = true

    try {
      const { assetResolverConfigs } = this
      for (const { sourceRoot, pipeline, acceptedPattern } of assetResolverConfigs) {
        chokidar
          .watch(acceptedPattern, {
            persistent: true,
            ...watchOptions,
            cwd: sourceRoot,
          })
          .on('add', filepath =>
            pipeline.push({
              type: AssetChangeEvent.CREATED,
              payload: { locations: [filepath] },
            }),
          )
          .on('change', filepath =>
            pipeline.push({
              type: AssetChangeEvent.MODIFIED,
              payload: { locations: [filepath] },
            }),
          )
          .on('unlink', filepath =>
            pipeline.push({
              type: AssetChangeEvent.REMOVED,
              payload: { locations: [filepath] },
            }),
          )
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
