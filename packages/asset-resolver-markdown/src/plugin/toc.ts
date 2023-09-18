import type {
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetResolverPlugin,
} from '@guanghechen/asset-types'
import { calcHeadingToc } from '@yozora/ast-util'
import type {
  IMarkdownAssetPolishOutput,
  IMarkdownPolishedData,
  IMarkdownResolverPlugin,
} from '../types'
import { isMarkdownPolishOutput } from '../types'

interface IParams {
  /**
   * Specify a prefix of heading identifier.
   */
  identifierPrefix?: string
}

export function markdownPluginToc(params: IParams = {}): IMarkdownResolverPlugin {
  const identifierPrefix: string | undefined = params.identifierPrefix

  const plugin: IMarkdownResolverPlugin = (): IAssetResolverPlugin => {
    return {
      get displayName(): string {
        return '@guanghechen/asset-resolver-markdown/toc'
      },
      async polish(
        input: Readonly<IAssetPluginPolishInput>,
        embryo: Readonly<IAssetPluginPolishOutput> | null,
        _api: Readonly<IAssetPluginPolishApi>,
        next: IAssetPluginPolishNext,
      ): Promise<IAssetPluginPolishOutput | null> {
        if (isMarkdownPolishOutput(input, embryo)) {
          const data: IMarkdownPolishedData = embryo.data
          const toc = calcHeadingToc(data.ast, identifierPrefix)
          const result: IMarkdownAssetPolishOutput = {
            ...embryo,
            data: { ...data, toc },
          }
          return next(result)
        }
        return next(embryo)
      },
    }
  }
  return plugin
}
