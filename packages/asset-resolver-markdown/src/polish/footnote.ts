import type {
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetPolishPlugin,
} from '@guanghechen/asset-types'
import type { FootnoteDefinition } from '@yozora/ast'
import { FootnoteDefinitionType } from '@yozora/ast'
import { calcFootnoteDefinitionMap, shallowMutateAstInPreorder } from '@yozora/ast-util'
import type { IMarkdownAssetPolishOutput } from '../types'
import { isMarkdownPolishOutput } from '../types'

export interface IMarkdownPolishFootnoteProps {
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
   * Preset footnote definitions.
   */
  presetFootnoteDefinitions?: ReadonlyArray<FootnoteDefinition>
  /**
   * Remove definition nodes from ast to save memories.
   * @default false
   */
  removeFootnoteDefinitionNodes?: boolean
}

export class MarkdownPolishFootnote implements IAssetPolishPlugin {
  public readonly displayName: string = '@guanghechen/asset-resolver-markdown/footnote'
  protected readonly identifierPrefix: string
  protected readonly preferReference: boolean
  protected readonly presetFootnoteDefinitions: ReadonlyArray<FootnoteDefinition>
  protected readonly removeFootnoteDefinitionNodes: boolean

  constructor(props: IMarkdownPolishFootnoteProps = {}) {
    this.identifierPrefix = props.identifierPrefix ?? 'footnote-'
    this.preferReference = props.preferReferences ?? true
    this.presetFootnoteDefinitions = props.presetFootnoteDefinitions ?? []
    this.removeFootnoteDefinitionNodes = props.removeFootnoteDefinitionNodes ?? false
  }

  public async polish(
    input: Readonly<IAssetPluginPolishInput>,
    embryo: Readonly<IAssetPluginPolishOutput> | null,
    api: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): Promise<IAssetPluginPolishOutput | null> {
    if (isMarkdownPolishOutput(input, embryo)) {
      const data = await embryo.data
      const { root, footnoteDefinitionMap } = calcFootnoteDefinitionMap(
        data.ast,
        undefined,
        this.presetFootnoteDefinitions,
        this.preferReference,
        this.identifierPrefix,
      )
      const ast = this.removeFootnoteDefinitionNodes
        ? shallowMutateAstInPreorder(root, [FootnoteDefinitionType], () => null)
        : root
      const result: IMarkdownAssetPolishOutput = {
        ...embryo,
        data: { ...data, ast, footnoteDefinitionMap },
      }
      return next(result)
    }
    return next(embryo)
  }
}
