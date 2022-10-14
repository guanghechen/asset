import type {
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetPolishPlugin,
} from '@guanghechen/asset-core-plugin'
import type { Definition } from '@yozora/ast'
import { calcDefinitionMap } from '@yozora/ast-util'
import type { IMarkdownPolishedData } from '../types'
import { isMarkdownPolishedData } from '../util/misc'

export interface IMarkdownParsePluginDefinitionProps {
  /**
   * Preset definition definitions.
   */
  presetDefinitions?: ReadonlyArray<Definition>
}

export class MarkdownParsePluginDefinition implements IAssetPolishPlugin {
  public readonly displayName: string = '@guanghechen/asset-parser-markdown/definition'
  protected readonly presetDefinitions: ReadonlyArray<Definition>

  constructor(props: IMarkdownParsePluginDefinitionProps = {}) {
    this.presetDefinitions = props.presetDefinitions ?? []
  }

  public async polish(
    input: Readonly<IAssetPluginPolishInput>,
    embryo: Readonly<IAssetPluginPolishOutput> | null,
    api: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): Promise<IAssetPluginPolishOutput | null> {
    if (isMarkdownPolishedData(input, embryo)) {
      const data = await embryo.data
      const { root, definitionMap } = calcDefinitionMap(data.ast, undefined, this.presetDefinitions)

      const result: IAssetPluginPolishOutput<IMarkdownPolishedData> = {
        ...embryo,
        data: {
          ...data,
          ast: root,
          definitionMap,
        },
      }
      return next(result)
    }
    return next(embryo)
  }
}
