import type { Root, YastNode, YastResource } from '@yozora/ast'
import { DefinitionType, ImageType, LinkType } from '@yozora/ast'
import { traverseAST } from '@yozora/ast-util'
import YozoraParser from '@yozora/parser'

const parser = new YozoraParser({
  defaultParseOptions: { shouldReservePosition: false },
})

export function parse(
  content: string,
  resolveUrl?: (url: string) => string,
): Root {
  const ast: Root = parser.parse(content)

  // Resolve url
  if (resolveUrl != null) {
    traverseAST(ast, [DefinitionType, LinkType, ImageType], node => {
      const o = node as YastNode & YastResource
      if (o.url != null) {
        const url = resolveUrl(o.url)
        o.url ??= url
      }
    })
  }

  return ast
}

export default parse
