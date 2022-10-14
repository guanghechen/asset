import type {
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetPolishPlugin,
} from '@guanghechen/asset-core-plugin'
import type { Root } from '@yozora/ast'
import type { IParser } from '@yozora/core-parser'
import YozoraParser from '@yozora/parser'
import type { IMarkdownPolishedData } from '../types'
import { getExcerptAst } from '../util/excerpt'
import { isMarkdownPolishedData } from '../util/misc'

export interface IMarkdownParsePluginExcerptProps {
  /**
   * Markdown parser.
   */
  parser?: IParser
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

export class MarkdownParsePluginExcerpt implements IAssetPolishPlugin {
  public readonly displayName: string = '@guanghechen/asset-parser-markdown/excerpt'
  protected readonly parser: IParser
  protected readonly pruneLength: number
  public readonly endingSeparator: string

  constructor(props: IMarkdownParsePluginExcerptProps = {}) {
    this.parser =
      props.parser ?? new YozoraParser({ defaultParseOptions: { shouldReservePosition: false } })
    this.pruneLength = props.pruneLength ?? 140
    this.endingSeparator = props.endingSeparator ?? '<!-- more -->'
  }

  public async polish(
    input: Readonly<IAssetPluginPolishInput>,
    embryo: Readonly<IAssetPluginPolishOutput> | null,
    api: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): Promise<IAssetPluginPolishOutput | null> {
    if (isMarkdownPolishedData(input, embryo)) {
      const data = await embryo.data
      const excerpt: Root = data.frontmatter.excerpt
        ? this.parser.parse(data.frontmatter.excerpt)
        : getExcerptAst(data.ast, this.pruneLength, this.endingSeparator)

      const result: IAssetPluginPolishOutput<IMarkdownPolishedData> = {
        ...embryo,
        data: {
          ...data,
          excerpt,
        },
      }
      return next(result)
    }
    return next(embryo)
  }
}
