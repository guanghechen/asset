import type { MdastRoot } from './types/mdast'
import gfm from 'remark-gfm'
import math from 'remark-math'
import markdown from 'remark-parse'
import unified from 'unified'

const processor = unified().use(markdown).use(gfm).use(math)


/**
 * Parse markdown to ast
 *
 * @param content
 */
export const parseToMdast = (content: string): MdastRoot => {
  // resolve content
  const result: MdastRoot = processor
    .runSync(processor.parse(content)) as MdastRoot
  return result
}
