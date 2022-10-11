import type {
  IAssetParsePlugin,
  IAssetPluginParseApi,
  IAssetPluginParseInput,
  IAssetPluginParseNext,
  IAssetPluginParseOutput,
} from '@guanghechen/asset-core-plugin'
import type { IMarkdownResolvedData } from '../types'
import { isMarkdownAsset } from '../types'
import { getTimeToRead } from '../util/timeToRead'

export interface IMarkdownParsePluginTimeToReadProps {
  /**
   * the number of words read per minute
   */
  wordsPerMinute?: number
}

export class MarkdownParsePluginTimeToRead implements IAssetParsePlugin {
  public readonly displayName: string = '@guanghechen/asset-parser-markdown/timeToRead'
  protected readonly wordsPerMinute: number | undefined

  constructor(props: IMarkdownParsePluginTimeToReadProps = {}) {
    this.wordsPerMinute = props.wordsPerMinute ?? undefined
  }

  public async parse(
    input: Readonly<IAssetPluginParseInput>,
    embryo: Readonly<IAssetPluginParseOutput> | null,
    api: Readonly<IAssetPluginParseApi>,
    next: IAssetPluginParseNext,
  ): Promise<IAssetPluginParseOutput | null> {
    if (isMarkdownAsset(embryo) && embryo.data) {
      const { ast, frontmatter } = embryo.data
      const timeToRead: number =
        frontmatter.timeToRead && Number.isInteger(frontmatter.timeToRead)
          ? frontmatter.timeToRead
          : getTimeToRead(ast, this.wordsPerMinute)
      const result: IAssetPluginParseOutput<IMarkdownResolvedData> = {
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
