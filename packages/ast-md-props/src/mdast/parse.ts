import gfm from 'remark-gfm'
import math from 'remark-math'
import markdown from 'remark-parse'
import unified from 'unified'
import type { MdastRoot } from './types'


const processor = unified().use(markdown).use(gfm).use(math)


/**
 * Parse markdown to ast
 *
 * @param rawContent
 */
export const parseMdast = (rawContent: string): MdastRoot => {
  // resolve content
  const result: MdastRoot = processor
    .runSync(processor.parse(rawContent)) as MdastRoot
  return result
}
