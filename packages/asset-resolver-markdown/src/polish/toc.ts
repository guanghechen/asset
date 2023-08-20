import type {
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetPolishPlugin,
} from '@guanghechen/asset-types'
import { calcHeadingToc } from '@yozora/ast-util'
import type { IMarkdownAssetPolishOutput } from '../types'
import { isMarkdownPolishOutput } from '../types'

export interface IMarkdownPolishTocProps {
  /**
   * Specify a prefix of heading identifier.
   */
  identifierPrefix?: string
}

export class MarkdownPolishToc implements IAssetPolishPlugin {
  public readonly displayName: string = '@guanghechen/asset-resolver-markdown/toc'
  public readonly identifierPrefix: string | undefined

  constructor(props: IMarkdownPolishTocProps = {}) {
    this.identifierPrefix = props.identifierPrefix
  }

  public async polish(
    input: Readonly<IAssetPluginPolishInput>,
    embryo: Readonly<IAssetPluginPolishOutput> | null,
    api: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): Promise<IAssetPluginPolishOutput | null> {
    if (isMarkdownPolishOutput(input, embryo)) {
      const data = await embryo.data
      const toc = calcHeadingToc(data.ast, this.identifierPrefix)
      const result: IMarkdownAssetPolishOutput = {
        ...embryo,
        data: { ...data, toc },
      }
      return next(result)
    }
    return next(embryo)
  }
}
