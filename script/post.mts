import { AssetService, AssetServiceConfigManager } from '@guanghechen/asset-api'
import { AssetResolver, AssetResolverApi, AssetResolverLocator } from '@guanghechen/asset-resolver'
import { AssetResolverFile, FileAssetType } from '@guanghechen/asset-resolver-file'
import { AssetResolverImage, ImageAssetType } from '@guanghechen/asset-resolver-image'
import {
  AssetResolverMarkdown,
  MarkdownAssetType,
  MarkdownLocateSlug,
  MarkdownParseCode,
  MarkdownParseStripSpace,
  MarkdownPolishAplayer,
  MarkdownPolishDefinition,
  MarkdownPolishEcmaImport,
  MarkdownPolishExcerpt,
  MarkdownPolishFootnote,
  MarkdownPolishTimeToRead,
  MarkdownPolishToc,
} from '@guanghechen/asset-resolver-markdown'
import { FileSourceAssetStorage } from '@guanghechen/asset-storage-file'
import type {
  IAssetResolver,
  IAssetResolverApi,
  IAssetResolverLocator,
  IAssetService,
  IAssetServiceConfig,
  IAssetServiceConfigManager,
  IAssetServiceWatcher,
  IAssetSourceStorage,
  IAssetTargetStorage,
} from '@guanghechen/asset-types'
import type { IReporter } from '@guanghechen/reporter.types'
import { YozoraParser } from '@yozora/parser'
import path from 'node:path'
import url from 'node:url'

const enum AssetGroupEnum {
  POST = 'post',
}

export const isEnvDevelopment: boolean = process.env.NODE_ENV === 'development'
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
export const FIXTURE_ROOT = path.join(__dirname, 'fixtures/asset-build')
export const FIXTURE_SOURCE_ROOT = path.join(FIXTURE_ROOT, 'src')
export const FIXTURE_TARGET_ROOT = path.join(FIXTURE_ROOT, 'static')

interface IProps {
  reporter: IReporter
  targetStorage: IAssetTargetStorage
}

export class PostGenerator {
  public readonly reporter: IReporter
  public readonly generators: AssetGroupGenerator[]

  constructor(props: IProps) {
    const { reporter, targetStorage } = props
    const generators: AssetGroupGenerator[] = [
      {
        group: AssetGroupEnum.POST,
        GUID_NAMESPACE: '188b0b6f-fc7e-4100-8b52-7615fd945c28',
        sourceRoots: [FIXTURE_SOURCE_ROOT].filter((x): x is string => typeof x === 'string'),
      },
    ].map(config =>
      AssetGroupGenerator.create(
        config.group,
        config.GUID_NAMESPACE,
        config.sourceRoots,
        targetStorage,
        reporter,
      ),
    )

    this.reporter = reporter
    this.generators = generators
  }

  public async build(): Promise<void> {
    console.log()
    this.reporter.info('[post] building...')
    await Promise.all(this.generators.map(generator => generator.build()))
    this.reporter.info('[post] built.')
    console.log()
  }

  public async watch(): Promise<IAssetServiceWatcher> {
    console.log()
    this.reporter.info('[post] start watching...')
    const watchers: IAssetServiceWatcher[] = await Promise.all(
      this.generators.map(generator => generator.watch()),
    )
    this.reporter.info('[post] watching...')
    console.log()

    return {
      unwatch: async () => {
        console.log()
        this.reporter.info('[post] unwatching...')
        await Promise.all(watchers.map(watcher => watcher.unwatch()))
        this.reporter.info('[post] unwatched.')
        console.log()
      },
    }
  }
}

class AssetGroupGenerator {
  public readonly group: AssetGroupEnum
  public readonly service: IAssetService
  public readonly configs: ReadonlyArray<IAssetServiceConfig>

  private constructor(
    group: AssetGroupEnum,
    service: IAssetService,
    configs: ReadonlyArray<IAssetServiceConfig>,
  ) {
    this.group = group
    this.service = service
    this.configs = configs
  }

  public build(): Promise<void> {
    return this.service.build(this.configs)
  }

  public watch(): Promise<IAssetServiceWatcher> {
    return this.service.watch(this.configs)
  }

  private static readonly _resolverMap: Map<AssetGroupEnum, IAssetResolver> = new Map()

  public static create(
    group: AssetGroupEnum,
    GUID_NAMESPACE: string,
    sourceRoots: string[],
    targetStorage: IAssetTargetStorage,
    reporter: IReporter,
  ): AssetGroupGenerator {
    const resolver: IAssetResolver = this.getAssetResolver(group, reporter)
    const service: IAssetService = new AssetService({ reporter })
    const configs = this.resolveServiceConfigs(
      group,
      GUID_NAMESPACE,
      reporter,
      resolver,
      sourceRoots,
      targetStorage,
    )
    return new AssetGroupGenerator(group, service, configs)
  }

  public static resolveServiceConfigs(
    group: AssetGroupEnum,
    GUID_NAMESPACE: string,
    reporter: IReporter,
    resolver: IAssetResolver,
    sourceRoots: string[],
    targetStorage: IAssetTargetStorage,
  ): IAssetServiceConfig[] {
    const dataMapUri: string = `/api/${group}.asset.map.json`
    const locator: IAssetResolverLocator = new AssetResolverLocator({
      resolveUriPrefix: async assetType => {
        switch (assetType) {
          case FileAssetType:
            return `/asset/file/${group}/`
          case ImageAssetType:
            return `/asset/img/${group}/`
          case MarkdownAssetType:
            return `/api/${group}/`
          default:
            return `/asset/unknown/${group}/`
        }
      },
    })
    const configManager: IAssetServiceConfigManager = new AssetServiceConfigManager({
      reporter,
      resolver,
      targetStorage,
      defaultAcceptedPattern: [
        '**/*.md',
        '**/*.jpg',
        '**/*.png',
        '**/*.jpeg',
        '**/*.gif',
        '**/*.txt',
        '**/*.pdf',
        '**/*.cpp',
        '**/*.ts',
        '**/*.py',
        '**/*.lyric',
      ],
    })

    for (const sourceRoot of sourceRoots) {
      const sourceStorage: IAssetSourceStorage = new FileSourceAssetStorage({
        rootDir: sourceRoot,
        caseSensitive: true,
      })
      const api: IAssetResolverApi = new AssetResolverApi({
        GUID_NAMESPACE,
        sourceStorage,
        locator,
      })
      configManager.register({ api, sourceStorage, dataMapUri })
    }
    return configManager.configs
  }

  public static getAssetResolver(group: AssetGroupEnum, reporter: IReporter): IAssetResolver {
    let resolver: IAssetResolver | undefined = this._resolverMap.get(group)

    if (resolver === undefined) {
      const markdownParser = new YozoraParser({
        defaultParseOptions: { shouldReservePosition: false },
      })
      resolver = new AssetResolver({ reporter })
        .use(
          new AssetResolverMarkdown({ parser: markdownParser }),
          new MarkdownLocateSlug({ slugPrefix: `/${group}/` }),
          new MarkdownParseCode(),
          new MarkdownParseStripSpace(),
          new MarkdownPolishAplayer(),
          new MarkdownPolishDefinition({ removeDefinitionNodes: true }),
          new MarkdownPolishFootnote({ removeFootnoteDefinitionNodes: true }),
          new MarkdownPolishEcmaImport(),
          new MarkdownPolishToc(),
          new MarkdownPolishExcerpt({ parser: markdownParser, pruneLength: 140 }),
          new MarkdownPolishTimeToRead({ wordsPerMinute: 140 }),
        )
        .use(
          new AssetResolverImage({
            accepted: filepath => {
              const { ext } = path.parse(filepath)
              if (['.jpg', '.png', '.jpeg', '.gif'].includes(ext)) return true
              return false
            },
          }),
        )
        .use(
          new AssetResolverFile({
            accepted: filepath => {
              const { ext } = path.parse(filepath)
              if (['.txt', '.pdf', '.cpp', '.ts', '.lyric'].includes(ext)) return true
              return false
            },
            rejected: filepath => {
              const pieces = filepath.toLowerCase().split(/[\s\d-_./\\]+/g)
              return pieces.some(piece => piece.trim() === 'password')
            },
          }),
        )

      this._resolverMap.set(group, resolver)
    }
    return resolver
  }
}
