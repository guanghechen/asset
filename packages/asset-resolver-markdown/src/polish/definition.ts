import type {
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetPolishPlugin,
} from '@guanghechen/asset-types'
import type { Definition } from '@yozora/ast'
import { DefinitionType } from '@yozora/ast'
import { calcDefinitionMap, shallowMutateAstInPreorder } from '@yozora/ast-util'
import type { IMarkdownAssetPolishOutput } from '../types'
import { isMarkdownPolishOutput } from '../types'

export interface IMarkdownPolishDefinitionProps {
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

export class MarkdownPolishDefinition implements IAssetPolishPlugin {
  public readonly displayName: string = '@guanghechen/asset-resolver-markdown/definition'
  protected readonly presetDefinitions: ReadonlyArray<Definition>
  protected readonly removeDefinitionNodes: boolean

  constructor(props: IMarkdownPolishDefinitionProps = {}) {
    this.presetDefinitions = props.presetDefinitions ?? []
    this.removeDefinitionNodes = props.removeDefinitionNodes ?? false
  }

  public async polish(
    input: Readonly<IAssetPluginPolishInput>,
    embryo: Readonly<IAssetPluginPolishOutput> | null,
    api: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): Promise<IAssetPluginPolishOutput | null> {
    if (isMarkdownPolishOutput(input, embryo)) {
      const data = await embryo.data
      const { root, definitionMap } = calcDefinitionMap(data.ast, undefined, this.presetDefinitions)
      const ast = this.removeDefinitionNodes
        ? shallowMutateAstInPreorder(root, [DefinitionType], () => null)
        : root
      const result: IMarkdownAssetPolishOutput = {
        ...embryo,
        data: { ...data, ast, definitionMap },
      }
      return next(result)
    }
    return next(embryo)
  }
}
