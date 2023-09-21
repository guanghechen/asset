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
import type { IParser } from '@guanghechen/asset-resolver-markdown'
import type { IAssetResolver } from '@guanghechen/asset-types'
import type { IReporter } from '@guanghechen/types'
import type { Definition, FootnoteDefinition } from '@yozora/ast'
import path from 'node:path'

export function createAsstResolver(
  slugPrefix: string,
  reporter: IReporter,
  parser: IParser,
  getPresetDefinitions?: () => Definition[] | undefined,
  getPresetFootnoteDefinitions?: () => FootnoteDefinition[] | undefined,
): IAssetResolver {
  const resolver: IAssetResolver = new AssetResolver({ reporter })
    .use(
      new AssetResolverMarkdown({
        parser,
        getPresetDefinitions,
        getPresetFootnoteDefinitions,
      })
        .use(markdownPluginSlug({ slugPrefix }))
        .use(markdownPluginCode())
        .use(markdownPluginStripSpace())
        .use(markdownPluginAplayer())
        .use(markdownPluginDefinition({ removeDefinitionNodes: true }))
        .use(markdownPluginFootnote({ removeFootnoteDefinitionNodes: true }))
        .use(markdownPluginEcmaImport())
        .use(markdownPluginImages())
        .use(markdownPluginToc())
        .use(markdownPluginExcerpt({ pruneLength: 140 }))
        .use(markdownPluginTimeToRead({ wordsPerMinute: 140 })),
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
