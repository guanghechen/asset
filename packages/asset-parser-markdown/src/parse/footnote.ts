import type {
  IAssetPluginPolishApi,
  IAssetPluginPolishInput,
  IAssetPluginPolishNext,
  IAssetPluginPolishOutput,
  IAssetPolishPlugin,
} from '@guanghechen/asset-core-plugin'
import type { FootnoteDefinition } from '@yozora/ast'
import { calcFootnoteDefinitionMap } from '@yozora/ast-util'
import type { IMarkdownPolishedData } from '../types'
import { isMarkdownPolishedData } from '../util/misc'

export interface IMarkdownParsePluginFootnoteProps {
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
}

export class MarkdownParsePluginFootnote implements IAssetPolishPlugin {
  public readonly displayName: string = '@guanghechen/asset-parser-markdown/footnote'
  protected readonly identifierPrefix: string
  protected readonly preferReference: boolean
  protected readonly presetFootnoteDefinitions: ReadonlyArray<FootnoteDefinition>

  constructor(props: IMarkdownParsePluginFootnoteProps = {}) {
    this.identifierPrefix = props.identifierPrefix ?? 'footnote-'
    this.preferReference = props.preferReferences ?? true
    this.presetFootnoteDefinitions = props.presetFootnoteDefinitions ?? []
  }

  public async polish(
    input: Readonly<IAssetPluginPolishInput>,
    embryo: Readonly<IAssetPluginPolishOutput> | null,
    api: Readonly<IAssetPluginPolishApi>,
    next: IAssetPluginPolishNext,
  ): Promise<IAssetPluginPolishOutput | null> {
    if (isMarkdownPolishedData(input, embryo)) {
      const data = await embryo.data
      const { root, footnoteDefinitionMap } = calcFootnoteDefinitionMap(
        data.ast,
        undefined,
        this.presetFootnoteDefinitions,
        this.preferReference,
        this.identifierPrefix,
      )

      const result: IAssetPluginPolishOutput<IMarkdownPolishedData> = {
        ...embryo,
        data: {
          ...data,
          ast: root,
          footnoteDefinitionMap,
        },
      }
      return next(result)
    }
    return next(embryo)
  }
}
