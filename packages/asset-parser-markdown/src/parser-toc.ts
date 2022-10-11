import type {
  IAssetPlugin,
  IAssetPluginParseApi,
  IAssetPluginParseInput,
  IAssetPluginParseNext,
  IAssetPluginParseOutput,
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

export class MarkdownAssetParserToc implements IAssetPlugin {
  public readonly displayName: string = '@guanghechen/asset-parser-markdown/toc'
  public readonly identifierPrefix: string | undefined

  constructor(props: IMarkdownAssetParserTocProps = {}) {
    this.identifierPrefix = props.identifierPrefix
  }

  public async parse(
    input: Readonly<IAssetPluginParseInput>,
    embryo: Readonly<IAssetPluginParseOutput> | null,
    api: Readonly<IAssetPluginParseApi>,
    next: IAssetPluginParseNext,
  ): Promise<IAssetPluginParseOutput | null> {
    if (isMarkdownAsset(embryo) && embryo.data) {
      const toc = calcHeadingToc(embryo.data.ast, this.identifierPrefix)
      const result: IAssetPluginParseOutput<IMarkdownResolvedData> = {
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
