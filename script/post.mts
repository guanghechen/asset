import type { IAssetResolverFlights } from '@guanghechen/asset-generator'
import { createAssetService, createAsstResolver } from '@guanghechen/asset-generator'
import type { IParser } from '@guanghechen/asset-resolver-markdown'
import { AssetPathResolver } from '@guanghechen/asset-storage'
import { FileAssetSourceStorage } from '@guanghechen/asset-storage-file'
import type {
  IAssetPathResolver,
  IAssetResolver,
  IAssetService,
  IAssetServiceWatcher,
  IAssetSourceStorage,
  IAssetTargetStorage,
  IEncodingDetector,
} from '@guanghechen/asset-types'
import { mime } from '@guanghechen/asset-util'
import type { IReporter } from '@guanghechen/reporter'
import YozoraParser from '@yozora/parser'
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

const parser: IParser = new YozoraParser({
  defaultParseOptions: { shouldReservePosition: false },
})

const encodingDetector: IEncodingDetector = {
  detect: async filepath => {
    const mimetype: string = mime.getType(filepath) ?? 'unknown'
    if (mimetype === 'application/json') return 'utf8'
    if (mimetype.startsWith('text/')) return 'utf8'
    if (mimetype.startsWith('image/')) return undefined
    return 'utf8'
  },
}

export class AssetGenerator {
  public readonly reporter: IReporter
  public readonly services: IAssetService[]
  public readonly acceptedPatterns: string[]

  constructor(reporter: IReporter, targetStorage: IAssetTargetStorage) {
    const flights: IAssetResolverFlights = {
      markdownSlug: true,
      markdownCode: true,
      markdownStripSpace: true,
      markdownAplayer: true,
      markdownDefinition: true,
      markdownFootnote: true,
      markdownEcmaImport: true,
      markdownImages: true,
      markdownToc: true,
      markdownExcerpt: true,
      markdownTimeToRead: true,
    }
    const services: IAssetService[] = [
      {
        enabled: true,
        group: AssetGroupEnum.POST,
        GUID_NAMESPACE: '188b0b6f-fc7e-4100-8b52-7615fd945c28',
        sourceRoots: [FIXTURE_SOURCE_ROOT].filter((x): x is string => typeof x === 'string'),
      },
    ]
      .filter(config => !!config.enabled)
      .map(config => {
        const pathResolver: IAssetPathResolver = new AssetPathResolver({
          caseSensitive: true,
          srcRoots: config.sourceRoots,
        })
        const sourceStorage: IAssetSourceStorage = new FileAssetSourceStorage({ pathResolver })
        const resolver: IAssetResolver = createAsstResolver({
          flights,
          parser,
          reporter,
          slugPrefix: `/${config.group}/`,
        })
        const service: IAssetService = createAssetService({
          group: config.group,
          GUID_NAMESPACE: config.GUID_NAMESPACE,
          encodingDetector,
          pathResolver,
          sourceStorage,
          targetStorage,
          reporter,
          resolver,
        })
        return service
      })

    this.reporter = reporter
    this.services = services
    this.acceptedPatterns = [
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
    ]
  }

  public async prepare(): Promise<void> {
    const { services } = this
    await Promise.all(services.map(service => service.prepare()))
  }

  public async close(): Promise<void> {
    const { services } = this
    await Promise.all(services.map(service => service.close()))
  }

  public async build(): Promise<void> {
    const { reporter, services, acceptedPatterns } = this

    console.log()
    reporter.info('[post] building...')
    await Promise.all(
      services
        .map(service =>
          service.pathResolver.srcRoots.map(srcRoot =>
            service.buildByPatterns(srcRoot, acceptedPatterns),
          ),
        )
        .flat(),
    )
    reporter.info('[post] built.')
    console.log()
  }

  public async watch(): Promise<IAssetServiceWatcher> {
    const { reporter, services, acceptedPatterns } = this

    console.log()
    reporter.info('[post] start watching...')
    const watchers: IAssetServiceWatcher[] = await Promise.all(
      services
        .map(service =>
          service.pathResolver.srcRoots.map(srcRoot => service.watch(srcRoot, acceptedPatterns)),
        )
        .flat(),
    )
    reporter.info('[post] watching...')
    console.log()

    return {
      unwatch: async () => {
        console.log()
        reporter.info('[post] unwatching...')
        await Promise.all(watchers.map(watcher => watcher.unwatch()))
        reporter.info('[post] unwatched.')
        console.log()
      },
    }
  }
}
