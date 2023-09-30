import type {
  IAssetPluginResolveApi,
  IAssetPluginResolveInput,
  IAssetPluginResolveNext,
  IAssetPluginResolveOutput,
  IAssetResolverPlugin,
} from '@guanghechen/asset-types'
import { normalizeUrlPath } from '@guanghechen/asset-util'
import type { IMarkdownResolverPlugin } from '../types'
import { isMarkdownAssetResolveOutput } from '../types'

type IResolveSlug = (slug: string | null, src: string) => Promise<string | null>

interface IParams {
  /**
   * Not worked if the `resolveSlug` specified.
   * @default '/page/post/'
   */
  slugPrefix?: string
  /**
   * Customized slug resolver.
   */
  resolveSlug?: IResolveSlug
}

export function markdownPluginSlug(params: IParams = {}): IMarkdownResolverPlugin {
  const slugPrefix: string = params.slugPrefix ?? '/page/post/'
  const defaultResolverSlug: IResolveSlug = async (slug, src) =>
    slug || slugPrefix + src.replace(/(\bindex)?\.[^.]+$/, '')
  const resolveSlug: IResolveSlug = params.resolveSlug ?? defaultResolverSlug

  const plugin: IMarkdownResolverPlugin = (): IAssetResolverPlugin => {
    return {
      get displayName(): string {
        return '@guanghechen/asset-resolver-markdown/slug'
      },
      async resolve(
        input: Readonly<IAssetPluginResolveInput>,
        embryo: Readonly<IAssetPluginResolveOutput> | null,
        _api: Readonly<IAssetPluginResolveApi>,
        next: IAssetPluginResolveNext,
      ): Promise<IAssetPluginResolveOutput | null> {
        if (isMarkdownAssetResolveOutput(embryo)) {
          let slug: string | null = await resolveSlug(embryo.slug, input.src)
          if (slug) slug = normalizeUrlPath(slug)
          if (slug !== embryo.slug) {
            const result: IAssetPluginResolveOutput = { ...embryo, slug }
            return next(result)
          }
        }
        return next(embryo)
      },
    }
  }
  return plugin
}
