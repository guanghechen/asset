import type {
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetResolverPlugin,
} from '@guanghechen/asset-types'
import type { Definition } from '@yozora/ast'
import { DefinitionType } from '@yozora/ast'
import { calcDefinitionMap, shallowMutateAstInPreorder } from '@yozora/ast-util'
import type {
  IMarkdownAssetPolishOutput,
  IMarkdownPolishedData,
  IMarkdownResolverPlugin,
} from '../types'
import { isMarkdownPolishOutput } from '../types'

interface IParams {
  /**
   * Preset definition definitions.
   */
  presetDefinitions?: ReadonlyArray<Definition>
  /**
   * Remove definition nodes from ast to save memories.
   * @default false
   */
  removeDefinitionNodes?: boolean
}

export function markdownPluginDefinition(params: IParams = {}): IMarkdownResolverPlugin {
  const removeDefinitionNodes: boolean = params.removeDefinitionNodes ?? false

  const plugin: IMarkdownResolverPlugin = (ctx): IAssetResolverPlugin => {
    return {
      get displayName(): string {
        return '@guanghechen/asset-resolver-markdown/definition'
      },
      async polish(
        input: Readonly<IAssetPluginPolishInput>,
        embryo: Readonly<IAssetPluginPolishOutput> | null,
        _api: Readonly<IAssetPluginPolishApi>,
        next: IAssetPluginPolishNext,
      ): Promise<IAssetPluginPolishOutput | null> {
        if (isMarkdownPolishOutput(input, embryo)) {
          const data: IMarkdownPolishedData = embryo.data
          const { root, definitionMap } = calcDefinitionMap(
            data.ast,
            undefined,
            ctx.getPresetDefinitions(),
          )
          const ast = removeDefinitionNodes
            ? shallowMutateAstInPreorder(root, [DefinitionType], () => null)
            : root
          const result: IMarkdownAssetPolishOutput = {
            ...embryo,
            data: { ...data, ast, definitionMap },
          }
          return next(result)
        }
        return next(embryo)
      },
    }
  }
  return plugin
}
