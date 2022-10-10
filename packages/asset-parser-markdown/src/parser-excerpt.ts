import type {
  IAssetParserPlugin,
  IAssetParserPluginParseApi,
  IAssetParserPluginParseInput,
  IAssetParserPluginParseNext,
  IAssetParserPluginParseOutput,
} from '@guanghechen/asset-core-parser'
import type { Root } from '@yozora/ast'
import type { IParser } from '@yozora/core-parser'
import YozoraParser from '@yozora/parser'
import type { IMarkdownResolvedData } from './types'
import { isMarkdownAsset } from './types'
import { getExcerptAst } from './util/excerpt'

export interface IMarkdownAssetParserExcerptProps {
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

export class MarkdownAssetParserExcerpt implements IAssetParserPlugin {
  public readonly displayName: string = '@guanghechen/asset-parser-markdown/excerpt'
  protected readonly parser: IParser
  protected readonly pruneLength: number
  public readonly endingSeparator: string

  constructor(props: IMarkdownAssetParserExcerptProps = {}) {
    this.parser =
      props.parser ?? new YozoraParser({ defaultParseOptions: { shouldReservePosition: false } })
    this.pruneLength = props.pruneLength ?? 140
    this.endingSeparator = props.endingSeparator ?? '<!-- more -->'
  }

  public async parse(
    input: Readonly<IAssetParserPluginParseInput>,
    embryo: Readonly<IAssetParserPluginParseOutput> | null,
    api: Readonly<IAssetParserPluginParseApi>,
    next: IAssetParserPluginParseNext,
  ): Promise<IAssetParserPluginParseOutput | null> {
    if (isMarkdownAsset(embryo) && embryo.data) {
      const { ast, frontmatter } = embryo.data
      const excerpt: Root = frontmatter.excerpt
        ? this.parser.parse(frontmatter.excerpt)
        : getExcerptAst(ast, this.pruneLength, this.endingSeparator)
      const result: IAssetParserPluginParseOutput<IMarkdownResolvedData> = {
        ...embryo,
        data: {
          ...embryo.data,
          excerpt,
        },
      }
      return next(result)
    }
    return next(embryo)
  }
}
