import type {
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetPolishPlugin,
} from '@guanghechen/asset-core-plugin'
import type { IMarkdownPolishedData } from '../types'
import { isMarkdownPolishedData } from '../util/misc'
import { getTimeToRead } from '../util/timeToRead'

export interface IMarkdownParsePluginTimeToReadProps {
  /**
   * the number of words read per minute
   */
  wordsPerMinute?: number
}

export class MarkdownParsePluginTimeToRead implements IAssetPolishPlugin {
  public readonly displayName: string = '@guanghechen/asset-parser-markdown/timeToRead'
  protected readonly wordsPerMinute: number | undefined

  constructor(props: IMarkdownParsePluginTimeToReadProps = {}) {
    this.wordsPerMinute = props.wordsPerMinute ?? undefined
  }

  public async polish(
    input: Readonly<IAssetPluginPolishInput>,
    embryo: Readonly<IAssetPluginPolishOutput> | null,
    api: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): Promise<IAssetPluginPolishOutput | null> {
    if (isMarkdownPolishedData(input, embryo)) {
      const data = await embryo.data
      const timeToRead: number =
        data.frontmatter.timeToRead && Number.isInteger(data.frontmatter.timeToRead)
          ? data.frontmatter.timeToRead
          : getTimeToRead(data.ast, this.wordsPerMinute)

      const result: IAssetPluginPolishOutput<IMarkdownPolishedData> = {
        ...embryo,
        data: {
          ...data,
          timeToRead,
        },
      }
      return next(result)
    }
    return next(embryo)
  }
}
