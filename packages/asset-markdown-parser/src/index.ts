import type { Node as MdastNode } from 'unist'
import type { MdastRoot } from './types/mdast'
import type { MdDocument, MdocNode } from './types/mdoc'
import { parseToMdast } from './parse'
import { resolveMdDocument } from './resolve'
export * from './parse'
export * from './resolve'
export * from './types/mdast'
export * from './types/mdoc'
export * from './util'

export function parse(
  content: string,
  resolveUrl: ((url: string) => string) = (url => url),
  fallbackParser?: (o: MdastNode) => MdocNode,
): MdDocument {
  const mdast: MdastRoot = parseToMdast(content)
  const result: MdDocument = resolveMdDocument(
    mdast, resolveUrl, fallbackParser)
  return result
}


export default parse
