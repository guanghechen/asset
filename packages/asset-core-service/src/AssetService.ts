import type { IAssetParser, IAssetResolver } from '@guanghechen/asset-core-parser'
import invariant from '@guanghechen/invariant'
import fs from 'fs-extra'
import path from 'path'
import type { IAssetUrlPrefixResolver, ISaveOptions } from './AssetResolver'
import { AssetResolver } from './AssetResolver'
import { collectAssetLocations } from './util/location'

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
}

export interface IAssetServiceProps {
  parser: IAssetParser
  staticRoot: string
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
    this.resolveUrlPathPrefix = props.resolveUrlPathPrefix
    this.runningTick = 0
    this.watching = false
  }

  public useResolver(config: IAssetResolverConfig): this {
    invariant(
      this.runningTick === 0,
      'You should add new AssetResolver while the service is running.',
    )

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
      resolveUrlPathPrefix: this.resolveUrlPathPrefix,
      caseSensitive,
      saveOptions: { ...this.saveOptions },
    })
    this.resolvers.push({
      resolver,
      GUID_NAMESPACE,
      sourceRoot,
      acceptedPattern,
    })

    return this
  }

  public async build(): Promise<void> {
    this.runningTick += 1
    const { parser, resolvers, assetDataMapFilepath, saveOptions } = this
    const { prettier = false } = saveOptions

    for (const resolver of resolvers) {
      const locations = await collectAssetLocations(['**/*', '*.cpp'], {
        cwd: resolver.sourceRoot,
        absolute: true,
      })
      await parser.create(resolver.resolver, locations)
    }
    const assetDataMap = parser.dump()
    await fs.writeJSON(assetDataMapFilepath, assetDataMap, prettier ? { spaces: 2 } : { spaces: 0 })
    this.runningTick -= 1
  }

  public async watch(): Promise<void> {
    if (this.watching) return
    this.runningTick += 1
    this.watching = true
  }

  public async stopWatch(): Promise<void> {
    if (!this.watching) return
    this.runningTick -= 1
    this.watching = false
  }
}
