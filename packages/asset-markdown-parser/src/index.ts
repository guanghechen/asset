import type { Node as MdastNode } from 'unist'
import { parseToMdast } from './parse'
import { resolveMdastProps } from './resolve'
import type { MdastRoot } from './types/mdast'
import type { MdastPropsNode, MdastPropsRoot } from './types/mdast-props'
export * from './parse'
export * from './resolve'
export * from './types/mdast'
export * from './types/mdast-props'
export * from './util'


export function parse(
  content: string,
  resolveUrl: ((url: string) => string) = (url => url),
  fallbackParser?: (o: MdastNode) => MdastPropsNode,
): MdastPropsRoot {
  const mdast: MdastRoot = parseToMdast(content)
  const MdastProps: MdastPropsRoot = resolveMdastProps(
    mdast, resolveUrl, fallbackParser)
  return MdastProps
}


export default parse
