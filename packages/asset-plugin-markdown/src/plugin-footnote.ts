import type {
  IAssetParserPlugin,
  IAssetParserPluginParseApi,
  IAssetParserPluginParseInput,
  IAssetParserPluginParseNext,
  IAssetParserPluginParseOutput,
} from '@guanghechen/asset-core-parser'
import type { Association, FootnoteDefinition } from '@yozora/ast'
import { FootnoteDefinitionType, FootnoteReferenceType } from '@yozora/ast'
import { calcFootnoteDefinitionMap, shallowMutateAstInPreorder } from '@yozora/ast-util'
import type { IMarkdownResolvedData } from './types'
import { isMarkdownAsset } from './types'

export interface IMarkdownAssetPluginFootnoteProps {
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

export class MarkdownAssetPluginFootnote implements IAssetParserPlugin {
  public readonly displayName: string = '@guanghechen/asset-plugin-markdown/footnote'
  protected readonly identifierPrefix: string
  protected readonly preferReference: boolean
  protected readonly presetFootnoteDefinitions: ReadonlyArray<FootnoteDefinition>

  constructor(props: IMarkdownAssetPluginFootnoteProps = {}) {
    this.identifierPrefix = props.identifierPrefix ?? 'footnote-'
    this.preferReference = props.preferReferences ?? true
    this.presetFootnoteDefinitions = props.presetFootnoteDefinitions ?? []
  }

  public async parse(
    input: Readonly<IAssetParserPluginParseInput>,
    embryo: Readonly<IAssetParserPluginParseOutput> | null,
    api: Readonly<IAssetParserPluginParseApi>,
    next: IAssetParserPluginParseNext,
  ): Promise<IAssetParserPluginParseOutput | null> {
    if (isMarkdownAsset(embryo) && embryo.data) {
      let ast = shallowMutateAstInPreorder(
        embryo.data.ast,
        [FootnoteReferenceType, FootnoteDefinitionType],
        node => {
          const o = node as unknown as Association
          return /^\d+$/.test(o.identifier)
            ? { ...node, identifier: this.identifierPrefix + o.identifier }
            : node
        },
      )

      if (this.preferReference) {
        ast = calcFootnoteDefinitionMap(
          ast,
          undefined,
          this.presetFootnoteDefinitions,
          true,
          this.identifierPrefix,
        ).root
      }

      const result: IAssetParserPluginParseOutput<IMarkdownResolvedData> = {
        ...embryo,
        data: { ast },
      }
      return next(result)
    }
    return next(embryo)
  }
}
