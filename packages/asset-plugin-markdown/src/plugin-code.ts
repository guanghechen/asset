import type {
  IAssetParserPlugin,
  IAssetParserPluginParseApi,
  IAssetParserPluginParseInput,
  IAssetParserPluginParseNext,
  IAssetParserPluginParseOutput,
} from '@guanghechen/asset-core-parser'
import { collectIntervals } from '@guanghechen/parse-lineno'
import type { Code } from '@yozora/ast'
import { CodeType } from '@yozora/ast'
import { shallowMutateAstInPreorder } from '@yozora/ast-util'
import type { IMarkdownResolvedData } from './types'
import { isMarkdownAsset } from './types'

export interface IMarkdownAssetPluginCodeProps {
  /**
   * Encoding of the source file.
   * @default 'utf8'
   */
  sourceEncoding?: BufferEncoding
  /**
   * The key of the meta data that indicate the source code filepath.
   * @default "sourcefile"  (case insensitive)
   */
  sourceFileToken?: string
  /**
   * @default "sourceline" (case insensitive)
   */
  sourceLineToken?: string
}

export class MarkdownAssetPluginCode implements IAssetParserPlugin {
  public readonly displayName: string = '@guanghechen/asset-plugin-markdown/code'
  protected readonly srcEncoding: BufferEncoding
  protected readonly srcFileRegex: RegExp
  protected readonly srcLineRegex: RegExp
  protected readonly indentRegex: RegExp = /^\s*/
  protected readonly lineRegex: RegExp = /\r|\n|\n\r/g

  constructor(props: IMarkdownAssetPluginCodeProps = {}) {
    this.srcEncoding = props.sourceEncoding ?? 'utf8'
    this.srcFileRegex = new RegExp(
      `(?:^|\\b)${props.sourceFileToken ?? 'sourcefile'}="([^"]+)"`,
      'i',
    )
    this.srcLineRegex = new RegExp(
      `(?:^|\\b)${props.sourceLineToken ?? 'sourceline'}="([^"]+)"`,
      'i',
    )
  }

  public async parse(
    input: Readonly<IAssetParserPluginParseInput>,
    embryo: Readonly<IAssetParserPluginParseOutput> | null,
    api: Readonly<IAssetParserPluginParseApi>,
    next: IAssetParserPluginParseNext,
  ): Promise<IAssetParserPluginParseOutput | null> {
    if (isMarkdownAsset(embryo) && embryo.data) {
      const { srcEncoding, srcFileRegex, srcLineRegex, indentRegex, lineRegex } = this
      const ast = shallowMutateAstInPreorder(embryo.data.ast, [CodeType], o => {
        const { meta } = o as Code
        if (meta == null) return o

        const sourcefileMatch = srcFileRegex.exec(meta!)
        if (sourcefileMatch == null) return o

        const srcRelativeLocation: string = sourcefileMatch[1]
        const rawContent = api.loadContentSync(srcRelativeLocation)
        if (rawContent === null) return o

        const content = rawContent.toString(srcEncoding)
        let value: string = content

        const sourcelineMatch = srcLineRegex.exec(meta!)
        if (sourcelineMatch != null) {
          const lineIntervals: Array<[number, number]> = collectIntervals(sourcelineMatch[1])

          let commonIndent = Number.MAX_SAFE_INTEGER
          if (lineIntervals.length > 0) {
            const lines: string[] = content.split(lineRegex)
            const requiredLines: string[] = []
            for (const [x, y] of lineIntervals) {
              if (x < 0) continue
              if (x >= lines.length) break
              for (let i = x - 1; i < y; ++i) {
                if (commonIndent > 0) {
                  const indent = indentRegex.exec(lines[i])![0].length
                  if (indent < lines[i].length && indent < commonIndent) {
                    commonIndent = indent
                  }
                }
                requiredLines.push(lines[i])
              }
            }

            // Trim common indents.
            if (commonIndent < Number.MAX_SAFE_INTEGER && commonIndent > 0) {
              value = requiredLines.map(x => x.slice(commonIndent)).join('\n')
            } else {
              value = requiredLines.join('\n')
            }
          }
        }

        return { ...o, value }
      })

      const result: IAssetParserPluginParseOutput<IMarkdownResolvedData> = {
        ...embryo,
        data: { ast },
      }
      return next(result)
    }
    return next(embryo)
  }
}
