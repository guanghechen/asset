import type {
  IAssetPlugin,
  IAssetPluginResolveApi,
  IAssetPluginResolveInput,
  IAssetPluginResolveNext,
  IAssetPluginResolveOutput,
} from '@guanghechen/asset-core-service'
import { normalizeSlug } from '@guanghechen/asset-core-service'
import type { IMarkdownResolvedData } from './types'
import { isMarkdownAsset } from './types'

export interface IMarkdownAssetPluginSlugProps {
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

export class MarkdownAssetPluginSlug implements IAssetPlugin {
  public readonly displayName: string = '@guanghechen/asset-plugin-markdown/slug'
  public readonly resolveSlug: (slug: string | null, src: string) => string | null

  constructor(props: IMarkdownAssetPluginSlugProps = {}) {
    const slugPrefix = props.slugPrefix ?? '/page/post/'
    this.resolveSlug =
      props.resolveSlug ??
      ((slug, src): string | null => slug || slugPrefix + src.replace(/\.[^.]+$/, ''))
  }

  public async resolve(
    input: Readonly<IAssetPluginResolveInput>,
    embryo: Readonly<IAssetPluginResolveOutput> | null,
    api: Readonly<IAssetPluginResolveApi>,
    next: IAssetPluginResolveNext,
  ): Promise<IAssetPluginResolveOutput | null> {
    if (isMarkdownAsset(embryo) && embryo.data) {
      let slug = this.resolveSlug(embryo.slug, input.src)
      if (slug) slug = normalizeSlug(slug)
      if (slug !== embryo.slug) {
        const result: IAssetPluginResolveOutput<IMarkdownResolvedData> = {
          ...embryo,
          slug,
        }
        return next(result)
      }
    }
    return next(embryo)
  }
}
