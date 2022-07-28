import type {
  IAssetParserPlugin,
  IAssetParserPluginParseApi,
  IAssetParserPluginParseInput,
  IAssetParserPluginParseNext,
  IAssetParserPluginParseOutput,
} from '@guanghechen/asset-core-parser'
import { normalizeUrlPath } from '@guanghechen/asset-core-parser'
import type { IMarkdownResolvedData } from './types'
import { isMarkdownAsset } from './types'

export interface IMarkdownAssetParserSlugProps {
  /**
   * Not worked if the `resolveSlug` specified.
   * @default '/page/post'
   */
  slugPrefix?: string
  /**
   * Customized slug resolver.
   */
  resolveSlug?: (slug: string | null, src: string) => string | null
}

export class MarkdownAssetParserSlug implements IAssetParserPlugin {
  public readonly displayName: string = '@guanghechen/asset-parser-markdown/slug'
  public readonly resolveSlug: (slug: string | null, src: string) => string | null

  constructor(props: IMarkdownAssetParserSlugProps = {}) {
    const slugPrefix = props.slugPrefix ?? '/page/post/'
    this.resolveSlug =
      props.resolveSlug ??
      ((slug, src): string | null => slug || slugPrefix + src.replace(/\.[^.]+$/, ''))
  }

  public async parse(
    input: Readonly<IAssetParserPluginParseInput>,
    embryo: Readonly<IAssetParserPluginParseOutput> | null,
    api: Readonly<IAssetParserPluginParseApi>,
    next: IAssetParserPluginParseNext,
  ): Promise<IAssetParserPluginParseOutput | null> {
    if (isMarkdownAsset(embryo) && embryo.data) {
      let slug = this.resolveSlug(embryo.slug, input.src)
      if (slug) slug = normalizeUrlPath(slug)
      if (slug !== embryo.slug) {
        const result: IAssetParserPluginParseOutput<IMarkdownResolvedData> = {
          ...embryo,
          slug,
        }
        return next(result)
      }
    }
    return next(embryo)
  }
}
