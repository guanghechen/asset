import type { Node as MdastNode } from 'unist'
import type {
  MdastCode,
  MdastDefinition,
  MdastHeading,
  MdastImageReference,
  MdastLink,
  MdastLinkReference,
  MdastList,
  MdastListItem,
  MdastParent,
  MdastRoot,
  MdastTable,
  MdastText,
} from '../mdast/types'
import {
  DESCENDANT_KEYS,
  PropsAstBlockContent,
  PropsAstBlockquote,
  PropsAstBreak,
  PropsAstCode,
  PropsAstDelete,
  PropsAstEmphasis,
  PropsAstFootnote,
  PropsAstHeading,
  PropsAstImage,
  PropsAstInlineCode,
  PropsAstInlineMath,
  PropsAstLink,
  PropsAstUnorderedList,
  PropsAstListContent,
  PropsAstListItem,
  PropsAstMeta,
  PropsAstNode,
  PropsAstParagraph,
  PropsAstPhrasingContent,
  PropsAstRoot,
  PropsAstRowContent,
  PropsAstStaticPhrasingContent,
  PropsAstStrong,
  PropsAstTable,
  PropsAstTableCell,
  PropsAstTableRow,
  PropsAstText,
  PropsAstThematicBreak,
  PropsAstOrderedList,
} from './types'


/**
 * Preprocess mdast tree
 *    - collect definitions
 *
 * @param root
 */
export function parsePropsAstMeta(root: MdastRoot): PropsAstMeta {
  const meta: PropsAstMeta = { definitions: {} }
  const resolve = (o: MdastNode) => {
    if (o.type === 'definition') {
      const { identifier, label, url, title, } = o as MdastDefinition

      // eslint-disable-next-line no-param-reassign
      meta.definitions[identifier] = { identifier, label, url, title } as any
      return
    }

    if (o.children != null) {
      const u = o as MdastParent
      for (const v of u.children) {
        resolve(v)
      }
    }
  }
  resolve(root)
  return meta
}


/**
 *
 * @param root
 */
export function parsePropsAst(root: MdastRoot): PropsAstRoot {
  const meta: PropsAstMeta = parsePropsAstMeta(root)

  const resolve = (o: MdastNode): PropsAstNode => {
    const resolveChildren = <T extends PropsAstNode = PropsAstNode>(): T[] => {
      if (o.children == null) return []
      return (o as MdastParent).children.map(resolve) as T[]
    }

    switch (o.type) {
      case 'blockquote': {
        const result: PropsAstBlockquote = {
          type: 'blockquote',
          children: resolveChildren<PropsAstBlockContent>(),
        }
        return result
      }
      case 'break': {
        const result: PropsAstBreak = {
          type: 'break',
        }
        return result
      }
      case 'code': {
        const u = o as MdastCode
        let args: Record<string, unknown> = {}
        if (u.meta != null) {
          try {
            // Try parsing as JSON data
            args = JSON.parse(u.meta)
          } catch (e) {
            // Try parsing as dom attributes
            args = {}
            const regex = /\s*\b([a-z]\w*)(?:=([^\s'"`]+|'[^']*'|"[^"]*"|`[^`]`))?/g
            u.meta.replace(regex, (m, p1, p2): string => {
              const key: string = p1.toLowerCase()
              const val: string | null = p2 == null
                ? null
                : p2.replace(/^(['"`])([\s\S]*?)\1$/, '$2')

              if (val != null) args[key] = val
              else {
                switch (key) {
                  case 'literal':
                  case 'embed':
                  case 'live':
                    args.mode = key
                    break
                }
              }

              return ''
            })
          }
        }

        const result: PropsAstCode = {
          type: 'code',
          value: u.value,
          lang: u.lang,
          mode: ['literal', 'embed', 'live'].find((x): x is any => x === args.mode),
          meta: u.meta,
          args,
        }
        return result
      }
      case 'delete': {
        const result: PropsAstDelete = {
          type: 'delete',
          children: resolveChildren<PropsAstPhrasingContent>(),
        }
        return result
      }
      case 'emphasis': {
        const result: PropsAstEmphasis = {
          type: 'emphasis',
          children: resolveChildren<PropsAstPhrasingContent>(),
        }
        return result
      }
      case 'footnote': {
        const result: PropsAstFootnote = {
          type: 'footnote',
          children: resolveChildren<PropsAstPhrasingContent>(),
        }
        return result
      }
      case 'heading': {
        const u = o as MdastHeading
        const result: PropsAstHeading = {
          type: 'heading',
          level: u.depth,
          children: resolveChildren<PropsAstPhrasingContent>(),
        }
        return result
      }
      case 'imageReference': {
        const u = o as MdastImageReference
        const ref = meta.definitions[u.identifier]
        const result: PropsAstImage = {
          type: 'image',
          url: ref.url,
          title: ref.title,
          alt: u.alt,
        }
        return result
      }
      case 'inlineCode': {
        const u = o as MdastCode
        const result: PropsAstInlineCode = {
          type: 'inlineCode',
          value: u.value,
        }
        return result
      }
      case 'inlineMath': {
        const result: PropsAstInlineMath = {
          type: 'inlineMath',
          value: o.value as string,
        }
        return result
      }
      case 'link': {
        const u = o as MdastLink
        const result: PropsAstLink = {
          type: 'link',
          url: u.url,
          title: u.title,
          children: resolveChildren<PropsAstStaticPhrasingContent>(),
        }
        return result
      }
      case 'linkReference': {
        const u = o as MdastLinkReference
        const ref = meta.definitions[u.identifier]
        const result: PropsAstLink = {
          type: 'link',
          url: ref.url,
          title: ref.title,
          children: resolveChildren<PropsAstStaticPhrasingContent>(),
        }
        return result
      }
      case 'list': {
        const u = o as MdastList
        const ordered = Boolean(u.ordered)
        const spread = Boolean(u.spread)
        const children = resolveChildren<PropsAstListContent>()

        if (ordered) {
          const result: PropsAstOrderedList = {
            type: 'olist',
            spread,
            children,
            start: u.start,
          }
          return result
        } else {
          const result: PropsAstUnorderedList = {
            type: 'ulist',
            spread,
            children,
          }
          return result
        }
      }
      case 'listItem': {
        const u = o as MdastListItem
        const result: PropsAstListItem = {
          type: 'listItem',
          checked: u.checked,
          spread: Boolean(u.spread),
          children: resolveChildren(),
        }
        return result
      }
      case 'paragraph': {
        const result: PropsAstParagraph = {
          type: 'paragraph',
          children: resolveChildren<PropsAstPhrasingContent>(),
        }
        return result
      }
      case 'strong': {
        const result: PropsAstStrong = {
          type: 'strong',
          children: resolveChildren<PropsAstPhrasingContent>(),
        }
        return result
      }
      case 'table': {
        const u = o as MdastTable

        const children = resolveChildren()
        const [head, ...body] = children!.map((row, index): any => {
          return {
            ...row,
            children: row.children.map((c: any, index: number) => ({
              isHeader: index <= 0,
              align: u.align![index],
              ...c,
            }))
          }
        })

        const result: PropsAstTable = {
          type: 'table',
          head,
          body,
          [DESCENDANT_KEYS]: ['head', 'body'],
        }
        return result
      }
      case 'tableCell': {
        const result: PropsAstTableCell = {
          type: 'tableCell',
          isHeader: o.isHeader,
          align: o.align as any,
          children: resolveChildren<PropsAstPhrasingContent>(),
        }
        return result
      }
      case 'tableRow': {
        const result: PropsAstTableRow = {
          type: 'tableRow',
          children: resolveChildren<PropsAstRowContent>(),
        }
        return result
      }
      case 'text': {
        const u = o as MdastText
        const result: PropsAstText = {
          type: 'text',
          value: u.value,
        }
        return result
      }
      case 'thematicBreak': {
        const result: PropsAstThematicBreak = {
          type: 'thematicBreak',
        }
        return result
      }
      default: {
        const { position, ...data } = o
        return data
      }
    }
  }

  const children = (root.children || []).map(resolve)
  const result: PropsAstRoot = { type: 'root', meta, children }
  return result
}
