import type {
  IAssetLocatePlugin,
  IAssetPluginLocateApi,
  IAssetPluginLocateInput,
  IAssetPluginLocateNext,
  IAssetPluginLocateOutput,
} from '@guanghechen/asset-types'
import { normalizeUrlPath } from '@guanghechen/asset-util'
import { isMarkdownAssetLocateOutput } from '../types'

export interface IMarkdownLocateSlugProps {
  /**
   * Not worked if the `resolveSlug` specified.
   * @default '/page/post/'
   */
  slugPrefix?: string
  /**
   * Customized slug resolver.
   */
  resolveSlug?(slug: string | null, src: string): Promise<string | null>
}

export class MarkdownLocateSlug implements IAssetLocatePlugin {
  public readonly displayName: string = '@guanghechen/asset-resolver-markdown/slug'
  public readonly resolveSlug: (slug: string | null, src: string) => Promise<string | null>

  constructor(props: IMarkdownLocateSlugProps = {}) {
    const slugPrefix = props.slugPrefix ?? '/page/post/'
    this.resolveSlug =
      props.resolveSlug ??
      ((slug, src): Promise<string | null> =>
        Promise.resolve(slug || slugPrefix + src.replace(/(\bindex)?\.[^.]+$/, '')))
  }

  public async locate(
    input: Readonly<IAssetPluginLocateInput>,
    embryo: Readonly<IAssetPluginLocateOutput> | null,
    _api: Readonly<IAssetPluginLocateApi>,
    next: IAssetPluginLocateNext,
  ): Promise<IAssetPluginLocateOutput | null> {
    if (isMarkdownAssetLocateOutput(embryo)) {
      let slug: string | null = await this.resolveSlug(embryo.slug, input.src)
      if (slug) slug = normalizeUrlPath(slug)
      if (slug !== embryo.slug) {
        const result: IAssetPluginLocateOutput = { ...embryo, slug }
        return next(result)
      }
    }
    return next(embryo)
  }
}
