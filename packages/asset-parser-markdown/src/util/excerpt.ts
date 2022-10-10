import type { Literal, Parent, Root } from '@yozora/ast'
import { calcExcerptAst, searchNode } from '@yozora/ast-util'

/**
 * Calc Yozora Markdown AST of excerpt content.
 * @param fullAst
 * @param pruneLength
 * @param excerptSeparator
 * @returns
 */
export function getExcerptAst(fullAst: Root, pruneLength: number, excerptSeparator?: string): Root {
  if (excerptSeparator != null) {
    const separator = excerptSeparator.trim()

    const childIndexList: number[] | null = searchNode(fullAst, node => {
      const { value } = node as Literal
      return typeof value === 'string' && value.trim() === separator
    })

    if (childIndexList != null) {
      const excerptAst = { ...fullAst }
      let node: Parent = excerptAst
      for (const childIndex of childIndexList) {
        const nextNode = { ...node.children[childIndex] } as unknown as Parent
        node.children = node.children.slice(0, childIndex)
        node.children.push(nextNode)
        node = nextNode
      }
      return excerptAst
    }
  }

  // Try to truncate excerpt.
  const excerptAst = calcExcerptAst(fullAst, pruneLength)
  return excerptAst
}
