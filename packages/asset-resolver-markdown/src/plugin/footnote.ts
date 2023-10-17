import type { IAssetResolverPlugin } from '@guanghechen/asset-types'
import { FootnoteDefinitionType } from '@yozora/ast'
import { calcFootnoteDefinitionMap, shallowMutateAstInPreorder } from '@yozora/ast-util'
import type {
  IMarkdownAssetPolishOutput,
  IMarkdownPolishedData,
  IMarkdownResolverPlugin,
} from '../types'
import { isMarkdownPolishOutput } from '../types'

interface IParams {
  /**
   * Footnote identifier prefix.
   * @default 'footnote-'
   */
  identifierPrefix?: string
  /**
   * Replace footnotes to footnote references as the later style is easy to render.
   * @default true
   */
  preferReferences?: boolean
  /**
   * Remove definition nodes from ast to save memories.
   * @default false
   */
  removeFootnoteDefinitionNodes?: boolean
}

export function markdownPluginFootnote(params: IParams): IMarkdownResolverPlugin {
  const identifierPrefix: string = params.identifierPrefix ?? 'footnote-'
  const preferReference: boolean = params.preferReferences ?? true
  const removeFootnoteDefinitionNodes: boolean = params.removeFootnoteDefinitionNodes ?? false

  const plugin: IMarkdownResolverPlugin = (ctx): IAssetResolverPlugin => {
    return {
      get displayName(): string {
        return '@guanghechen/asset-resolver-markdown/footnote'
      },
      async polish(input, embryo, _api, next) {
        if (isMarkdownPolishOutput(input, embryo)) {
          const data: IMarkdownPolishedData = embryo.data
          const { root, footnoteDefinitionMap } = calcFootnoteDefinitionMap(
            data.ast,
            undefined,
            ctx.getPresetFootnoteDefinitions(),
            preferReference,
            identifierPrefix,
          )
          const ast = removeFootnoteDefinitionNodes
            ? shallowMutateAstInPreorder(root, [FootnoteDefinitionType], () => null)
            : root
          const result: IMarkdownAssetPolishOutput = {
            ...embryo,
            data: { ...data, ast, footnoteDefinitionMap },
          }
          return next(result)
        }
        return next(embryo)
      },
    }
  }
  return plugin
}
