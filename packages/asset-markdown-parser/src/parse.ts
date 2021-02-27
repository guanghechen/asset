import type { MdastRoot } from './types/mdast'
import { createExGFMParser } from '@yozora/parser-gfm'

const parser = createExGFMParser({ shouldReservePosition: false })

/**
 * Parse markdown to ast
 *
 * @param content
 */
export const parseToMdast = (content: string): MdastRoot => {
  // resolve content
  const result: MdastRoot = parser.parse(content) as MdastRoot
  return result
}
