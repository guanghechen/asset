import type { IAssetResolverPlugin } from '@guanghechen/asset-types'
import type {
  IMarkdownAssetPolishOutput,
  IMarkdownPolishedData,
  IMarkdownResolverPlugin,
} from '../types'
import { isMarkdownPolishOutput } from '../types'
import { getTimeToRead } from '../util/timeToRead'

interface IParams {
  /**
   * the number of words read per minute
   */
  wordsPerMinute?: number
}

export function markdownPluginTimeToRead(params: IParams = {}): IMarkdownResolverPlugin {
  const wordsPerMinute: number | undefined = params.wordsPerMinute

  const plugin: IMarkdownResolverPlugin = (): IAssetResolverPlugin => {
    return {
      get displayName(): string {
        return '@guanghechen/asset-resolver-markdown/timeToRead'
      },
      async polish(input, embryo, _api, next) {
        if (isMarkdownPolishOutput(input, embryo)) {
          const data: IMarkdownPolishedData = embryo.data
          const timeToRead: number =
            data.frontmatter.timeToRead && Number.isInteger(data.frontmatter.timeToRead)
              ? data.frontmatter.timeToRead
              : getTimeToRead(data.ast, wordsPerMinute)

          const result: IMarkdownAssetPolishOutput = {
            ...embryo,
            data: { ...data, timeToRead },
          }
          return next(result)
        }
        return next(embryo)
      },
    }
  }
  return plugin
}
