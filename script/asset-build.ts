import { AssetParser } from '@guanghechen/asset-core-plugin'
import { AssetService } from '@guanghechen/asset-core-service'
import { FileAssetType, FileParserPlugin } from '@guanghechen/asset-parser-file'
import {
  MarkdownAssetType,
  MarkdownParsePluginCode,
  MarkdownParsePluginDefinition,
  MarkdownParsePluginEcmaImport,
  MarkdownParsePluginExcerpt,
  MarkdownParsePluginFootnote,
  MarkdownParsePluginSlug,
  MarkdownParsePluginTimeToRead,
  MarkdownParsePluginToc,
  MarkdownParserPlugin,
} from '@guanghechen/asset-parser-markdown'
import { YozoraParser } from '@yozora/parser'
import path from 'node:path'
import url from 'node:url'

interface IBuildOptions {
  sourceRoot: string
  targetRoot: string
  shouldBuild: boolean
  shouldWatch: boolean
}

async function build(options: IBuildOptions): Promise<void> {
  const { sourceRoot, targetRoot, shouldBuild, shouldWatch } = options
  const markdownParser = new YozoraParser({ defaultParseOptions: { shouldReservePosition: false } })
  const parser = new AssetParser()
    .use(
      new MarkdownParserPlugin({ parser: markdownParser }),
      new MarkdownParsePluginSlug({ slugPrefix: '/post/' }),
      new MarkdownParsePluginCode(),
      new MarkdownParsePluginDefinition(),
      new MarkdownParsePluginFootnote(),
      new MarkdownParsePluginEcmaImport(),
      new MarkdownParsePluginToc(),
      new MarkdownParsePluginTimeToRead({ wordsPerMinute: 60 }),
      new MarkdownParsePluginExcerpt({ parser: markdownParser, pruneLength: 140 }),
    )
    .use(
      new FileParserPlugin({
        accepted: filepath => {
          const { ext } = path.parse(filepath)
          if (['.txt', '.jpg', '.png'].includes(ext)) return true
          return false
        },
        rejected: filepath => {
          const pieces = filepath.toLowerCase().split(/[\s\d-_./\\]+/g)
          return pieces.some(piece => piece.trim() === 'password')
        },
      }),
    )
  const service = new AssetService({
    parser,
    staticRoot: targetRoot,
    acceptedPattern: ['!**/*.cpp'],
    assetDataMapFilepath: 'api/asset.map.json',
    resolveUrlPathPrefix: ({ assetType, mimetype }) => {
      switch (assetType) {
        case MarkdownAssetType:
          return '/api/post/'
        case FileAssetType: {
          if (mimetype.startsWith('image/')) return '/asset/image'
          switch (mimetype) {
            default:
              return '/asset/file/'
          }
        }
        default:
          return '/asset/unknown/'
      }
    },
    caseSensitive: true,
    saveOptions: { prettier: true },
  }).useResolver({
    sourceRoot: sourceRoot,
    GUID_NAMESPACE: '188b0b6f-fc7e-4100-8b52-7615fd945c28',
  })

  if (shouldBuild || !shouldWatch) {
    console.log('building...')
    await service.build()
  }

  if (shouldWatch) {
    console.log('watching...')
    await service.watch()
  }
}

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const FIXTURE_ROOT = path.join(__dirname, 'fixtures/asset-build')
const FIXTURE_SOURCE_ROOT = path.join(FIXTURE_ROOT, 'src')
const FIXTURE_TARGET_ROOT = path.join(FIXTURE_ROOT, 'static')

void build({
  shouldBuild: process.argv.some(arg => /--build/.test(arg)),
  shouldWatch: process.argv.some(arg => /--watch/.test(arg)),
  sourceRoot: FIXTURE_SOURCE_ROOT,
  targetRoot: FIXTURE_TARGET_ROOT,
})
