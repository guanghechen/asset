import type {
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetResolverPlugin,
} from '@guanghechen/asset-types'
import type { Root } from '@yozora/ast'
import { getExcerptAst } from '@yozora/ast-util'
import type {
  IMarkdownAssetPolishOutput,
  IMarkdownPolishedData,
  IMarkdownResolverPlugin,
} from '../types'
import { isMarkdownPolishOutput } from '../types'

interface IParams {
  /**
   * @default 140
   */
  pruneLength?: number
  /**
   * Excerpt ending separator.
   * @default '<!-- more -->'
   */
  endingSeparator?: string
}

export function markdownPluginExcerpt(params: IParams): IMarkdownResolverPlugin {
  const pruneLength: number = params.pruneLength ?? 140
  const endingSeparator: string = params.endingSeparator ?? '<!-- more -->'

  const plugin: IMarkdownResolverPlugin = (ctx): IAssetResolverPlugin => {
    return {
      get displayName(): string {
        return '@guanghechen/asset-resolver-markdown/excerpt'
      },
      async polish(
        input: Readonly<IAssetPluginPolishInput>,
        embryo: Readonly<IAssetPluginPolishOutput> | null,
        _api: Readonly<IAssetPluginPolishApi>,
        next: IAssetPluginPolishNext,
      ): Promise<IAssetPluginPolishOutput | null> {
        if (isMarkdownPolishOutput(input, embryo)) {
          const data: IMarkdownPolishedData = embryo.data
          const excerpt: Root = data.frontmatter.excerpt
            ? ctx.parseMarkdown(data.frontmatter.excerpt)
            : getExcerptAst(data.ast, pruneLength, endingSeparator)

          const result: IMarkdownAssetPolishOutput = {
            ...embryo,
            data: { ...data, excerpt },
          }
          return next(result)
        }
        return next(embryo)
      },
    }
  }
  return plugin
}
