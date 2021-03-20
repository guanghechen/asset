import type { YastRoot } from '@yozora/core-tokenizer'
import { createExGFMParser } from '@yozora/parser-gfm'

const parser = createExGFMParser({ shouldReservePosition: false })

/**
 * Parse markdown to ast
 *
 * @param content
 */
export const parseToMdast = (content: string): YastRoot => {
  // resolve content
  const result: YastRoot = parser.parse(content) as YastRoot
  return result
}
