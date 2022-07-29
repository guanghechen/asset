import type { IAssetParser, IAssetResolver } from '@guanghechen/asset-core-parser'
import invariant from '@guanghechen/invariant'
import chokidar from 'chokidar'
import fs from 'fs-extra'
import path from 'path'
import type { IAssetUrlPrefixResolver, ISaveOptions } from './AssetResolver'
import { AssetResolver } from './AssetResolver'
import type { IAssetChangeTask } from './types/misc'
import { AssetChangeEvent } from './types/misc'
import { collectAssetLocations } from './util/location'
import { delay, isSameSet } from './util/misc'
import { TaskPipeline } from './util/TaskPipeline'

export interface IAssetResolverConfig {
  GUID_NAMESPACE: string
  sourceRoot: string
  acceptedPattern?: string[]
  caseSensitive?: boolean
}

export interface IAssetResolverItem {
  resolver: IAssetResolver
  sourceRoot: string
  GUID_NAMESPACE: string
  acceptedPattern: string[]
  pipeline: TaskPipeline<IAssetChangeTask>
}

export interface IAssetServiceProps {
  parser: IAssetParser
  staticRoot: string
  /**
   * Wait a few million seconds after file content changed.
   */
  delayAfterContentChanged?: number
  assetDataMapFilepath?: string
  acceptedPattern?: string[]
  caseSensitive?: boolean
  saveOptions?: Partial<ISaveOptions>
  resolveUrlPathPrefix: IAssetUrlPrefixResolver
}

export class AssetService {
  protected readonly parser: IAssetParser
  protected readonly resolvers: IAssetResolverItem[]
  protected readonly staticRoot: string
  protected readonly assetDataMapFilepath: string
  protected readonly saveOptions: Partial<ISaveOptions>
  protected readonly defaultAcceptedPattern: string[]
  protected readonly defaultCaseSensitive: boolean
  protected readonly delayAfterContentChanged: number
  protected readonly resolveUrlPathPrefix: IAssetUrlPrefixResolver
  protected runningTick: number
  protected watching: boolean

  constructor(props: IAssetServiceProps) {
    this.parser = props.parser
    this.resolvers = []
    this.staticRoot = props.staticRoot
    this.assetDataMapFilepath = path.resolve(
      this.staticRoot,
      props.assetDataMapFilepath ?? 'asset.map.json',
    )
    this.saveOptions = { ...props.saveOptions }
    this.defaultAcceptedPattern = props.acceptedPattern?.slice() ?? ['**/*']
    this.defaultCaseSensitive = props.caseSensitive ?? true
    this.delayAfterContentChanged = props.delayAfterContentChanged ?? 200
    this.resolveUrlPathPrefix = props.resolveUrlPathPrefix
    this.runningTick = 0
    this.watching = false
  }

  public useResolver(config: IAssetResolverConfig): this {
    invariant(
      this.runningTick === 0,
      'You should add new AssetResolver while the service is running.',
    )

    const { parser, saveOptions, resolveUrlPathPrefix } = this
    const {
      GUID_NAMESPACE,
      sourceRoot,
      acceptedPattern = this.defaultAcceptedPattern.slice(),
      caseSensitive = this.defaultCaseSensitive,
    } = config

    const resolver = new AssetResolver({
      GUID_NAMESPACE,
      sourceRoot,
      staticRoot: this.staticRoot,
      resolveUrlPathPrefix,
      caseSensitive,
      saveOptions: { ...saveOptions },
    })

    this.resolvers.push({
      resolver,
      GUID_NAMESPACE,
      sourceRoot,
      acceptedPattern,
      pipeline: new TaskPipeline<IAssetChangeTask>({
        handleTask: async task => {
          switch (task.type) {
            case AssetChangeEvent.CREATED:
              await parser.create(resolver, task.payload.locations)
              break
            case AssetChangeEvent.REMOVED:
              await parser.remove(resolver, task.payload.locations)
              break
            case AssetChangeEvent.MODIFIED:
              await parser.remove(resolver, task.payload.locations)
              await parser.create(resolver, task.payload.locations)
              await delay(this.delayAfterContentChanged)
              break
            default: {
              const details = task == null ? task : JSON.stringify(task)
              throw new Error(`[AssetService.watch -- handleTask] Unexpected task: ${details}`)
            }
          }
          await this.dumpAssetDataMap()
        },
        squash: (task, nextTask) => {
          if (task.type === nextTask.type) {
            switch (task.type) {
              case AssetChangeEvent.CREATED:
              case AssetChangeEvent.REMOVED:
              case AssetChangeEvent.MODIFIED: {
                const locations = Array.from(
                  new Set([...task.payload.locations, ...nextTask.payload.locations]),
                )
                return { type: task.type, payload: { locations } }
              }
              default:
                return false
            }
          }

          const locations1 = task.payload.locations
          const locations2 = nextTask.payload.locations
          if (!isSameSet<string>(locations1, locations2)) return false
          if (nextTask.type === AssetChangeEvent.REMOVED) return { ...nextTask }
          return false
        },
      }),
    })

    return this
  }

  public async build(): Promise<void> {
    this.runningTick += 1
    const { parser, resolvers } = this
    for (const resolver of resolvers) {
      const locations = await collectAssetLocations(['**/*', '*.cpp'], {
        cwd: resolver.sourceRoot,
        absolute: true,
      })
      await parser.create(resolver.resolver, locations)
    }
    await this.dumpAssetDataMap()
    this.runningTick -= 1
  }

  public async watch(watchOptions?: Partial<chokidar.WatchOptions>): Promise<void> {
    if (this.watching) return
    this.runningTick += 1
    this.watching = true

    const { resolvers } = this
    for (const { sourceRoot, pipeline } of resolvers) {
      chokidar
        .watch(sourceRoot, {
          persistent: true,
          ...watchOptions,
        })
        .on('add', filepath =>
          pipeline.addTask({
            type: AssetChangeEvent.CREATED,
            payload: { locations: [filepath] },
          }),
        )
        .on('change', filepath =>
          pipeline.addTask({
            type: AssetChangeEvent.MODIFIED,
            payload: { locations: [filepath] },
          }),
        )
        .on('unlink', filepath =>
          pipeline.addTask({
            type: AssetChangeEvent.REMOVED,
            payload: { locations: [filepath] },
          }),
        )
    }

    await delay(500)
    await Promise.allSettled(resolvers.map(resolver => resolver.pipeline.run()))
  }

  public async stopWatch(): Promise<void> {
    if (!this.watching) return
    this.runningTick -= 1
    this.watching = false
    await Promise.allSettled(this.resolvers.map(resolver => resolver.pipeline.cancel()))
  }

  protected async dumpAssetDataMap(): Promise<void> {
    const { parser, assetDataMapFilepath, saveOptions } = this
    const assetDataMap = parser.dump()
    await fs.writeJSON(
      assetDataMapFilepath,
      assetDataMap,
      saveOptions.prettier ? { spaces: 2 } : { spaces: 0 },
    )
  }
}
