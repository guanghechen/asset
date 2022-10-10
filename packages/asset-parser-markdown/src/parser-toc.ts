import type {
  IAssetParserPlugin,
  IAssetParserPluginParseApi,
  IAssetParserPluginParseInput,
  IAssetParserPluginParseNext,
  IAssetParserPluginParseOutput,
} from '@guanghechen/asset-core-parser'
import { calcHeadingToc } from '@yozora/ast-util'
import type { IMarkdownResolvedData } from './types'
import { isMarkdownAsset } from './types'

export interface IMarkdownAssetParserTocProps {
  /**
   * Specify a prefix of heading identifier.
   */
  identifierPrefix?: string
}

export class MarkdownAssetParserToc implements IAssetParserPlugin {
  public readonly displayName: string = '@guanghechen/asset-parser-markdown/toc'
  public readonly identifierPrefix: string | undefined

  constructor(props: IMarkdownAssetParserTocProps = {}) {
    this.identifierPrefix = props.identifierPrefix
  }

  public async parse(
    input: Readonly<IAssetParserPluginParseInput>,
    embryo: Readonly<IAssetParserPluginParseOutput> | null,
    api: Readonly<IAssetParserPluginParseApi>,
    next: IAssetParserPluginParseNext,
  ): Promise<IAssetParserPluginParseOutput | null> {
    if (isMarkdownAsset(embryo) && embryo.data) {
      const toc = calcHeadingToc(embryo.data.ast, this.identifierPrefix)
      const result: IAssetParserPluginParseOutput<IMarkdownResolvedData> = {
        ...embryo,
        data: {
          ...embryo.data,
          toc,
        },
      }
      return next(result)
    }
    return next(embryo)
  }
}
