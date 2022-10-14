import type {
  IAssetParsePlugin,
  IAssetPluginParseApi,
  IAssetPluginParseInput,
  IAssetPluginParseNext,
  IAssetPluginParseOutput,
} from '@guanghechen/asset-core-plugin'
import { normalizeUrlPath } from '@guanghechen/asset-core-plugin'
import type { IMarkdownResolvedData } from '../types'
import { isMarkdownAsset } from '../util/misc'

export interface IMarkdownParsePluginSlugProps {
  /**
   * Not worked if the `resolveSlug` specified.
   * @default '/page/post/'
   */
  slugPrefix?: string
  /**
   * Customized slug resolver.
   */
  resolveSlug?: (slug: string | null, src: string) => string | null
}

export class MarkdownParsePluginSlug implements IAssetParsePlugin {
  public readonly displayName: string = '@guanghechen/asset-parser-markdown/slug'
  public readonly resolveSlug: (slug: string | null, src: string) => string | null

  constructor(props: IMarkdownParsePluginSlugProps = {}) {
    const slugPrefix = props.slugPrefix ?? '/page/post/'
    this.resolveSlug =
      props.resolveSlug ??
      ((slug, src): string | null => slug || slugPrefix + src.replace(/\.[^.]+$/, ''))
  }

  public async parse(
    input: Readonly<IAssetPluginParseInput>,
    embryo: Readonly<IAssetPluginParseOutput> | null,
    api: Readonly<IAssetPluginParseApi>,
    next: IAssetPluginParseNext,
  ): Promise<IAssetPluginParseOutput | null> {
    if (isMarkdownAsset(embryo) && embryo.data) {
      let slug = this.resolveSlug(embryo.slug, input.src)
      if (slug) slug = normalizeUrlPath(slug)
      if (slug !== embryo.slug) {
        const result: IAssetPluginParseOutput<IMarkdownResolvedData> = {
          ...embryo,
          slug,
        }
        return next(result)
      }
    }
    return next(embryo)
  }
}
