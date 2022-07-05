import type { Node, Resource, Root } from '@yozora/ast'
import { DefinitionType, ImageType, LinkType } from '@yozora/ast'
import { traverseAst } from '@yozora/ast-util'
import YozoraParser from '@yozora/parser'

const parser = new YozoraParser({
  defaultParseOptions: { shouldReservePosition: false },
})

export function parse(content: string, resolveUrl?: (url: string) => string): Root {
  const ast: Root = parser.parse(content)

  // Resolve url
  if (resolveUrl != null) {
    traverseAst(ast, [DefinitionType, LinkType, ImageType], node => {
      const o = node as Node & Resource
      if (o.url != null) {
        const url = resolveUrl(o.url)
        o.url ??= url
      }
    })
  }

  return ast
}

export default parse
