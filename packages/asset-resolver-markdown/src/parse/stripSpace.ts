import type {
  IAssetParsePlugin,
  IAssetPluginParseApi,
  IAssetPluginParseInput,
  IAssetPluginParseNext,
  IAssetPluginParseOutput,
} from '@guanghechen/asset-types'
import type { Text } from '@yozora/ast'
import { TextType } from '@yozora/ast'
import { shallowMutateAstInPreorder } from '@yozora/ast-util'
import { stripChineseCharacters } from '@yozora/character'
import type { IMarkdownAssetParseOutput } from '../types'
import { isMarkdownAssetParseOutput } from '../types'

export interface IMarkdownParseStripSpaceProps {
  /**
   * Whether if strip space between chinese characters.
   * @default true
   */
  betweenChineseCharacters?: boolean
}

export class MarkdownParseStripSpace implements IAssetParsePlugin {
  public readonly displayName: string = '@guanghechen/asset-resolver-markdown/stripSpace'
  protected readonly betweenChineseCharacters: boolean

  constructor(props: IMarkdownParseStripSpaceProps = {}) {
    this.betweenChineseCharacters = props.betweenChineseCharacters ?? true
  }

  public async parse(
    input: Readonly<IAssetPluginParseInput>,
    embryo: Readonly<IAssetPluginParseOutput> | null,
    api: Readonly<IAssetPluginParseApi>,
    next: IAssetPluginParseNext,
  ): Promise<IAssetPluginParseOutput | null> {
    if (isMarkdownAssetParseOutput(input, embryo) && embryo.data) {
      let ast = embryo.data.ast
      if (this.betweenChineseCharacters) {
        ast = shallowMutateAstInPreorder(embryo.data.ast, [TextType], node => {
          const text = node as Text
          const nextValue: string = text.value ? stripChineseCharacters(text.value) : text.value
          return text.value === nextValue ? node : { ...node, value: nextValue }
        })
      }
      const result: IMarkdownAssetParseOutput = {
        ...embryo,
        data: { ...embryo.data, ast },
      }
      return next(result)
    }
    return next(embryo)
  }
}
