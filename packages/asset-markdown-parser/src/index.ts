import type { YastNode, YastRoot } from '@yozora/core-tokenizer'
import { parseToMdast } from './parse'
import { resolveMdDocument } from './resolve'
import type { MdDocument, MdocNode } from './types/mdoc'

export * from './parse'
export * from './resolve'
export * from './types/mdoc'
export * from './util'

export function parse(
  content: string,
  resolveUrl: (url: string) => string = url => url,
  fallbackParser?: (o: YastNode) => MdocNode,
): MdDocument {
  const mdast: YastRoot = parseToMdast(content)
  const result: MdDocument = resolveMdDocument(
    mdast,
    resolveUrl,
    fallbackParser,
  )
  return result
}

export default parse
