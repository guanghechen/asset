import type {
  IAssetPluginParseApi,
  IAssetPluginParseInput,
  IAssetPluginParseNext,
  IAssetPluginParseOutput,
  IAssetResolverPlugin,
} from '@guanghechen/asset-types'
import type { Text } from '@yozora/ast'
import { TextType } from '@yozora/ast'
import { shallowMutateAstInPreorder } from '@yozora/ast-util'
import { stripChineseCharacters } from '@yozora/character'
import type { IMarkdownAssetParseOutput, IMarkdownResolverPlugin } from '../types'
import { isMarkdownAssetParseOutput } from '../types'

interface IParams {
  /**
   * Whether if strip space between chinese characters.
   * @default true
   */
  betweenChineseCharacters?: boolean
}

export function markdownPluginStripSpace(params: IParams = {}): IMarkdownResolverPlugin {
  const betweenChineseCharacters: boolean = params.betweenChineseCharacters ?? true

  const plugin: IMarkdownResolverPlugin = (): IAssetResolverPlugin => {
    return {
      get displayName(): string {
        return '@guanghechen/asset-resolver-markdown/stripSpace'
      },

      async parse(
        input: Readonly<IAssetPluginParseInput>,
        embryo: Readonly<IAssetPluginParseOutput> | null,
        _api: Readonly<IAssetPluginParseApi>,
        next: IAssetPluginParseNext,
      ): Promise<IAssetPluginParseOutput | null> {
        if (isMarkdownAssetParseOutput(input, embryo) && embryo.data) {
          let ast = embryo.data.ast
          if (betweenChineseCharacters) {
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
      },
    }
  }
  return plugin
}
