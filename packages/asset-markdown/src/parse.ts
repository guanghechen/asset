import gfm from 'remark-gfm'
import math from 'remark-math'
import markdown from 'remark-parse'
import unified from 'unified'
import removePosition from 'unist-util-remove-position'
import { AssetMarkdownEntityContent } from './entity'


export type MarkdownParser<T extends unknown = unknown> =
  (content: string) => AssetMarkdownEntityContent<T>


/**
 * Parse markdown to ast
 *
 * @param rawContent
 */
const processor = unified().use(markdown).use(gfm).use(math)
export const parseMarkdownToAst: MarkdownParser<any> = (rawContent) => {
  // resolve content
  const content: any = processor.runSync(processor.parse(rawContent))
  const summary: any = {
    type: 'root',
    children: content.children.slice(0, 3),
  }

  const result = {
    content: removePosition(content, false),
    summary: removePosition(summary, false),
  }
  return result
}


/**
 * Preserve the raw content
 *
 * @param rawContent
 */
export const preserveMarkdown: MarkdownParser<string> = (rawContent) => {
  return {
    content: rawContent,
    summary: '',
  }
}
