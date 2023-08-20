import { AssetResolver } from '@guanghechen/asset-api'
import { AssetService } from '@guanghechen/asset-api-local'
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
import type { ChalkLogger } from '@guanghechen/chalk-logger'
import type { IReporter } from '@guanghechen/scheduler'
import { YozoraParser } from '@yozora/parser'
import path from 'node:path'
import url from 'node:url'

export const isEnvDevelopment: boolean = process.env.NODE_ENV === 'development'
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const FIXTURE_ROOT = path.join(__dirname, 'fixtures/asset-build')
const FIXTURE_SOURCE_ROOT = path.join(FIXTURE_ROOT, 'src')
const FIXTURE_TARGET_ROOT = path.join(FIXTURE_ROOT, 'static')

void generatePosts({
  mode: process.argv.some(arg => /--build/.test(arg))
    ? 'build'
    : process.argv.some(arg => /--watch/.test(arg))
    ? 'watch'
    : 'build',
})

interface IInternalGenerateParams {
  GUID_NAMESPACE: string
  sourceRoots: string[]
  targetRoot: string
  shouldBuild: boolean
  shouldWatch: boolean
  logger: ChalkLogger | undefined
}

interface IGeneratePostsParams {
  mode: 'build' | 'watch'
  logger?: ChalkLogger
}

export async function generatePosts(params: IGeneratePostsParams): Promise<void> {
  const { mode, logger } = params
  const promises: Array<Promise<void>> = [
    {
      GUID_NAMESPACE: '188b0b6f-fc7e-4100-8b52-7615fd945c28',
      sourceRoots: [FIXTURE_SOURCE_ROOT].filter((x): x is string => typeof x === 'string'),
    },
  ].map(
    (
      buildOptions: Pick<IInternalGenerateParams, 'GUID_NAMESPACE' | 'sourceRoots'> &
        Partial<Pick<IInternalGenerateParams, 'targetRoot'>>,
    ): Promise<void> =>
      internalGenerate({
        GUID_NAMESPACE: buildOptions.GUID_NAMESPACE,
        sourceRoots: buildOptions.sourceRoots,
        targetRoot: buildOptions.targetRoot ?? path.join(FIXTURE_TARGET_ROOT, 'data'),
        shouldBuild: mode === 'build',
        shouldWatch: mode === 'watch',
        logger,
      }),
  )
  await Promise.all(promises)
}

async function internalGenerate(options: IInternalGenerateParams): Promise<void> {
  const { sourceRoots, targetRoot, shouldBuild, shouldWatch, logger } = options
  const markdownParser = new YozoraParser({ defaultParseOptions: { shouldReservePosition: false } })
  const parser = new AssetResolver()
    .use(
      new AssetResolverMarkdown({ parser: markdownParser }),
      new MarkdownLocateSlug({ slugPrefix: `/post/` }),
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

  const reporter: IReporter = {
    reportError: error => logger?.error(error),
  }
  const service = new AssetService({
    resolver: parser,
    reporter,
    staticRoot: targetRoot,
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
    assetDataMapFilepath: `api/post.asset.map.json`,
    resolveUrlPathPrefix: ({ assetType }) => {
      switch (assetType) {
        case FileAssetType:
          return `/asset/file/post/`
        case ImageAssetType:
          return `/asset/img/post/`
        case MarkdownAssetType:
          return `/api/post/`
        default:
          return `/asset/unknown/post/`
      }
    },
    caseSensitive: true,
    saveOptions: { prettier: true },
  })

  for (const sourceRoot of sourceRoots) {
    service.registerAsset({
      sourceRoot: sourceRoot,
      GUID_NAMESPACE: '188b0b6f-fc7e-4100-8b52-7615fd945c28',
    })
  }

  if (shouldBuild) {
    console.log('building...')
    await service.build()
  }

  if (shouldWatch) {
    console.log('watching...')
    await service.watch()
  }
}
