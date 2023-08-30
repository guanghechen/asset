import type {
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetPolishPlugin,
} from '@guanghechen/asset-types'
import type { Root } from '@yozora/ast'
import { getExcerptAst } from '@yozora/ast-util'
import type { IParser } from '@yozora/core-parser'
import YozoraParser from '@yozora/parser'
import type { IMarkdownAssetPolishOutput, IMarkdownPolishedData } from '../types'
import { isMarkdownPolishOutput } from '../types'

export interface IMarkdownPolishExcerptProps {
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

export class MarkdownPolishExcerpt implements IAssetPolishPlugin {
  public readonly displayName: string = '@guanghechen/asset-resolver-markdown/excerpt'
  protected readonly parser: IParser
  protected readonly pruneLength: number
  public readonly endingSeparator: string

  constructor(props: IMarkdownPolishExcerptProps = {}) {
    this.parser =
      props.parser ?? new YozoraParser({ defaultParseOptions: { shouldReservePosition: false } })
    this.pruneLength = props.pruneLength ?? 140
    this.endingSeparator = props.endingSeparator ?? '<!-- more -->'
  }

  public async polish(
    input: Readonly<IAssetPluginPolishInput>,
    embryo: Readonly<IAssetPluginPolishOutput> | null,
    _api: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): Promise<IAssetPluginPolishOutput | null> {
    if (isMarkdownPolishOutput(input, embryo)) {
      const data: IMarkdownPolishedData = embryo.data
      const excerpt: Root = data.frontmatter.excerpt
        ? this.parser.parse(data.frontmatter.excerpt)
        : getExcerptAst(data.ast, this.pruneLength, this.endingSeparator)

      const result: IMarkdownAssetPolishOutput = {
        ...embryo,
        data: { ...data, excerpt },
      }
      return next(result)
    }
    return next(embryo)
  }
}
