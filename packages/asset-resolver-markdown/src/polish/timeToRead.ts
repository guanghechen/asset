import type {
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetPolishPlugin,
} from '@guanghechen/asset-types'
import type { IMarkdownAssetPolishOutput } from '../types'
import { isMarkdownPolishOutput } from '../types'
import { getTimeToRead } from '../util/timeToRead'

export interface IMarkdownPolishTimeToReadProps {
  /**
   * the number of words read per minute
   */
  wordsPerMinute?: number
}

export class MarkdownPolishTimeToRead implements IAssetPolishPlugin {
  public readonly displayName: string = '@guanghechen/asset-resolver-markdown/timeToRead'
  protected readonly wordsPerMinute: number | undefined

  constructor(props: IMarkdownPolishTimeToReadProps = {}) {
    this.wordsPerMinute = props.wordsPerMinute ?? undefined
  }

  public async polish(
    input: Readonly<IAssetPluginPolishInput>,
    embryo: Readonly<IAssetPluginPolishOutput> | null,
    api: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): Promise<IAssetPluginPolishOutput | null> {
    if (isMarkdownPolishOutput(input, embryo)) {
      const data = await embryo.data
      const timeToRead: number =
        data.frontmatter.timeToRead && Number.isInteger(data.frontmatter.timeToRead)
          ? data.frontmatter.timeToRead
          : getTimeToRead(data.ast, this.wordsPerMinute)

      const result: IMarkdownAssetPolishOutput = {
        ...embryo,
        data: { ...data, timeToRead },
      }
      return next(result)
    }
    return next(embryo)
  }
}
