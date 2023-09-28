import { AssetResolver } from '@guanghechen/asset-resolver'
import { AssetResolverFile } from '@guanghechen/asset-resolver-file'
import { AssetResolverImage } from '@guanghechen/asset-resolver-image'
import {
  AssetResolverMarkdown,
  markdownPluginAplayer,
  markdownPluginCode,
  markdownPluginDefinition,
  markdownPluginEcmaImport,
  markdownPluginExcerpt,
  markdownPluginFootnote,
  markdownPluginImages,
  markdownPluginSlug,
  markdownPluginStripSpace,
  markdownPluginTimeToRead,
  markdownPluginToc,
} from '@guanghechen/asset-resolver-markdown'
import type { IMarkdownResolverPlugin, IParser } from '@guanghechen/asset-resolver-markdown'
import type { IAssetResolver } from '@guanghechen/asset-types'
import type { IReporter } from '@guanghechen/types'
import type { Definition, FootnoteDefinition } from '@yozora/ast'
import path from 'node:path'

export interface IAssetResolverFlights {
  markdownSlug: boolean
  markdownCode: boolean
  markdownStripSpace: boolean
  markdownAplayer: boolean
  markdownDefinition: boolean
  markdownFootnote: boolean
  markdownEcmaImport: boolean
  markdownImages: boolean
  markdownToc: boolean
  markdownExcerpt: boolean
  markdownTimeToRead: boolean
}

export interface ICreateAssetResolverParams {
  slugPrefix: string
  reporter: IReporter
  parser: IParser
  flights: IAssetResolverFlights
  customizedMarkdownPlugins?: IMarkdownResolverPlugin[]
  getPresetDefinitions?: () => Definition[] | undefined
  getPresetFootnoteDefinitions?: () => FootnoteDefinition[] | undefined
}

export function createAsstResolver(params: ICreateAssetResolverParams): IAssetResolver {
  const {
    slugPrefix,
    reporter,
    parser,
    flights,
    customizedMarkdownPlugins,
    getPresetDefinitions,
    getPresetFootnoteDefinitions,
  } = params
  const resolver: IAssetResolver = new AssetResolver({ reporter })
    .use(
      new AssetResolverMarkdown({
        parser,
        getPresetDefinitions,
        getPresetFootnoteDefinitions,
      }).use(
        ...[
          flights.markdownSlug ? markdownPluginSlug({ slugPrefix }) : undefined,
          flights.markdownCode ? markdownPluginCode() : undefined,
          flights.markdownStripSpace ? markdownPluginStripSpace() : undefined,
          flights.markdownAplayer ? markdownPluginAplayer() : undefined,
          flights.markdownDefinition
            ? markdownPluginDefinition({ removeDefinitionNodes: true })
            : undefined,
          flights.markdownFootnote
            ? markdownPluginFootnote({ removeFootnoteDefinitionNodes: true })
            : undefined,
          flights.markdownEcmaImport ? markdownPluginEcmaImport() : undefined,
          flights.markdownImages ? markdownPluginImages() : undefined,
          flights.markdownToc ? markdownPluginToc() : undefined,
          flights.markdownExcerpt ? markdownPluginExcerpt({ pruneLength: 140 }) : undefined,
          flights.markdownTimeToRead
            ? markdownPluginTimeToRead({ wordsPerMinute: 140 })
            : undefined,
          ...(customizedMarkdownPlugins ?? []),
        ].filter((x): x is IMarkdownResolverPlugin => x !== undefined),
      ),
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

  return resolver
}
