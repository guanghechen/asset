import type {
  IAssetParserPlugin,
  IAssetParserPluginParseApi,
  IAssetParserPluginParseInput,
  IAssetParserPluginParseNext,
  IAssetParserPluginParseOutput,
} from '@guanghechen/asset-core-parser'
import type { IMarkdownResolvedData } from './types'
import { isMarkdownAsset } from './types'
import { getTimeToRead } from './util/timeToRead'

export interface IMarkdownAssetParserTimeToReadProps {
  /**
   * the number of words read per minute
   */
  wordsPerMinute?: number
}

export class MarkdownAssetParserTimeToRead implements IAssetParserPlugin {
  public readonly displayName: string = '@guanghechen/asset-parser-markdown/timeToRead'
  protected readonly wordsPerMinute: number | undefined

  constructor(props: IMarkdownAssetParserTimeToReadProps = {}) {
    this.wordsPerMinute = props.wordsPerMinute ?? undefined
  }

  public async parse(
    input: Readonly<IAssetParserPluginParseInput>,
    embryo: Readonly<IAssetParserPluginParseOutput> | null,
    api: Readonly<IAssetParserPluginParseApi>,
    next: IAssetParserPluginParseNext,
  ): Promise<IAssetParserPluginParseOutput | null> {
    if (isMarkdownAsset(embryo) && embryo.data) {
      const { ast, frontmatter } = embryo.data
      const timeToRead: number =
        frontmatter.timeToRead && Number.isInteger(frontmatter.timeToRead)
          ? frontmatter.timeToRead
          : getTimeToRead(ast, this.wordsPerMinute)
      const result: IAssetParserPluginParseOutput<IMarkdownResolvedData> = {
        ...embryo,
        data: {
          ...embryo.data,
          timeToRead,
        },
      }
      return next(result)
    }
    return next(embryo)
  }
}
