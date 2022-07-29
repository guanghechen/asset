import { AssetParser } from '@guanghechen/asset-core-parser'
import { AssetService } from '@guanghechen/asset-core-service'
import { FileAssetParser, FileAssetType } from '@guanghechen/asset-parser-file'
import {
  MarkdownAssetParser,
  MarkdownAssetParserCode,
  MarkdownAssetParserFootnote,
  MarkdownAssetParserSlug,
  MarkdownAssetType,
} from '@guanghechen/asset-parser-markdown'
import path from 'node:path'

async function build(): Promise<void> {
  const FIXTURE_ROOT = path.join(__dirname, 'fixtures/asset-build')
  const FIXTURE_SOURCE_ROOT = path.join(FIXTURE_ROOT, 'src')
  const FIXTURE_STATIC_ROOT = path.join(FIXTURE_ROOT, 'static')

  const parser = new AssetParser()
    .use(
      new MarkdownAssetParser(),
      new MarkdownAssetParserCode(),
      new MarkdownAssetParserFootnote(),
      new MarkdownAssetParserSlug(),
    )
    .use(
      new FileAssetParser({
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
    staticRoot: FIXTURE_STATIC_ROOT,
    acceptedPattern: ['!**/*.cpp'],
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
    sourceRoot: FIXTURE_SOURCE_ROOT,
    GUID_NAMESPACE: '188b0b6f-fc7e-4100-8b52-7615fd945c28',
  })

  // console.log('building...')
  // await service.build()

  console.log('watching...')
  await service.watch()
}

void build()
