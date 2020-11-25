import parseMd from './parse'
import { resolveMdastProps } from './resolve'
import { MdastRoot } from './types/mdast'
import { MdastPropsRoot } from './types/mdast-props'
export * from './parse'
export * from './resolve'
export * from './types/mdast'
export * from './types/mdast-props'


export function MdParser(content: string): MdastPropsRoot {
  const mdast: MdastRoot = parseMd(content)
  const MdastProps: MdastPropsRoot = resolveMdastProps(mdast)
  return MdastProps
}


export default MdParser
