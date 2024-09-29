import type { IAssetResolverPlugin } from '@guanghechen/asset-types'
import { collectIntervals } from '@guanghechen/std'
import type { Code } from '@yozora/ast'
import { CodeType } from '@yozora/ast'
import { shallowMutateAstInPreorderAsync } from '@yozora/ast-util'
import type { IMarkdownAssetParseOutput, IMarkdownResolverPlugin } from '../types'
import { isMarkdownAssetParseOutput } from '../types'

interface IParams {
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

export function markdownPluginCode(params: IParams = {}): IMarkdownResolverPlugin {
  const srcEncoding: BufferEncoding = params.sourceEncoding ?? 'utf8'
  const srcFileRegex: RegExp = new RegExp(
    `(?:^|\\b)${params.sourceFileToken ?? 'sourcefile'}="([^"]+)"`,
    'i',
  )
  const srcLineRegex: RegExp = new RegExp(
    `(?:^|\\b)${params.sourceLineToken ?? 'sourceline'}="([^"]+)"`,
    'i',
  )
  const indentRegex: RegExp = /^\s*/
  const lineRegex: RegExp = /\r|\n|\n\r/g

  const plugin: IMarkdownResolverPlugin = (): IAssetResolverPlugin => {
    return {
      get displayName(): string {
        return '@guanghechen/asset-resolver-markdown/code'
      },
      async parse(input, embryo, api, next) {
        if (isMarkdownAssetParseOutput(input, embryo) && embryo.data) {
          const ast = await shallowMutateAstInPreorderAsync(
            embryo.data.ast,
            [CodeType],
            async o => {
              const { meta } = o as Code
              if (meta == null) return o

              const sourcefileMatch = srcFileRegex.exec(meta!)
              if (sourcefileMatch == null) return o

              const relativeSrcPath: string = sourcefileMatch[1]
              const refPath: string | null = await api.resolveRefPath(relativeSrcPath)
              if (refPath === null) return o

              const rawContent = await api.loadContent(refPath)
              if (rawContent === null) return o

              const content = rawContent.toString(srcEncoding)
              let value: string = content

              const srcLineMatch = srcLineRegex.exec(meta!)
              if (srcLineMatch != null) {
                const lineIntervals: Array<[number, number]> = collectIntervals(srcLineMatch[1])

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
            },
          )

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
