import type { Node as MdastNode } from 'unist'
import type {
  MdastCode,
  MdastDefinition,
  MdastHeading,
  MdastImage,
  MdastImageReference,
  MdastLink,
  MdastLinkReference,
  MdastList,
  MdastListItem,
  MdastParent,
  MdastRoot,
  MdastTable,
  MdastText,
} from './types/mdast'
import type {
  MdDocument,
  MdDocumentMeta,
  MdDocumentToc,
  MdDocumentTocAnchor,
  MdocBlockContent,
  MdocBlockquote,
  MdocBreak,
  MdocCode,
  MdocCodeEmbed,
  MdocCodeLive,
  MdocDelete,
  MdocEmphasis,
  MdocFootnote,
  MdocHeading,
  MdocImage,
  MdocInlineCode,
  MdocInlineMath,
  MdocLink,
  MdocList,
  MdocListContent,
  MdocListItem,
  MdocNode,
  MdocParagraph,
  MdocPhrasingContent,
  MdocRowContent,
  MdocStaticPhrasingContent,
  MdocStrong,
  MdocTable,
  MdocTableCell,
  MdocTableRow,
  MdocText,
  MdocThematicBreak,
} from './types/mdoc'
import { calcIdentifierForHeading } from './util'


/**
 * Preprocess mdast tree
 *    - collect definitions
 *
 * @param root
 */
export function resolveMdDocumentMeta(root: MdastRoot): MdDocumentMeta {
  const meta: MdDocumentMeta = {
    definitions: {},
  }

  const resolve = (o: MdastNode) => {
    if (o.type === 'definition') {
      const { identifier, label, url, title } = o as MdastDefinition

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
 * @param resolveUrl      resolve link url and image src
 * @param fallbackParser
 */
export function resolveMdDocument(
  root: MdastRoot,
  resolveUrl: (url: string) => string,
  fallbackParser?: (o: MdastNode) => MdocNode,
): MdDocument {
  const meta: MdDocumentMeta = resolveMdDocumentMeta(root)
  const toc: MdDocumentToc = { anchors: [] }

  type AnchorHolder = {
    depth: number,
    anchor: MdDocumentTocAnchor
    parent: AnchorHolder | null,
  }
  let currentAnchorHolder: AnchorHolder | null = null

  const resolve = (o: MdastNode): MdocNode => {
    const resolveChildren = <T extends MdocNode = MdocNode>(): T[] => {
      if (o.children == null) return []
      return (o as MdastParent).children.map(resolve) as T[]
    }

    switch (o.type) {
      case 'blockquote': {
        const result: MdocBlockquote = {
          type: 'blockquote',
          children: resolveChildren<MdocBlockContent>(),
        }
        return result
      }
      case 'break': {
        const result: MdocBreak = {
          type: 'break',
        }
        return result
      }
      case 'code': {
        const u = o as MdastCode
        let args: Record<string, unknown> = {}
        let type: 'code' | 'codeEmbed' | 'codeLive' = 'code'

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
                    type = 'code'
                    break
                  case 'embed':
                    type = 'codeEmbed'
                    break
                  case 'live':
                    type = 'codeLive'
                    break
                }
              }

              return ''
            })
          }
        }

        const result: MdocCode | MdocCodeEmbed | MdocCodeLive = {
          type,
          value: u.value,
          lang: u.lang,
          meta: u.meta,
          args,
        }
        return result
      }
      case 'delete': {
        const result: MdocDelete = {
          type: 'delete',
          children: resolveChildren<MdocPhrasingContent>(),
        }
        return result
      }
      case 'emphasis': {
        const result: MdocEmphasis = {
          type: 'emphasis',
          children: resolveChildren<MdocPhrasingContent>(),
        }
        return result
      }
      case 'footnote': {
        const result: MdocFootnote = {
          type: 'footnote',
          children: resolveChildren<MdocPhrasingContent>(),
        }
        return result
      }
      case 'heading': {
        const { depth } = o as MdastHeading
        const children = resolveChildren<MdocPhrasingContent>()
        const identifier: string = calcIdentifierForHeading(children)

        const heading: MdocHeading = {
          type: 'heading',
          level: depth,
          identifier,
          children,
        }

        const anchor: MdDocumentTocAnchor = {
          id: heading.identifier,
          title: heading.children,
        }

        for (; currentAnchorHolder != null && currentAnchorHolder.depth >= depth;) {
          currentAnchorHolder = currentAnchorHolder.parent
        }

        const nextAnchorHolder: AnchorHolder = {
          anchor,
          depth,
          parent: currentAnchorHolder
        }

        // new top anchor
        if (currentAnchorHolder == null) {
          toc.anchors.push(anchor)
          currentAnchorHolder = nextAnchorHolder
        } else {
          // append to parent anchor
          const children = currentAnchorHolder.anchor.children || []
          children.push(anchor)
          currentAnchorHolder.anchor.children = children
          currentAnchorHolder = nextAnchorHolder
        }

        return heading
      }
      case 'image': {
        const u = o as MdastImage
        const result: MdocImage = {
          type: 'image',
          src: resolveUrl(u.url),
          title: u.title,
          alt: u.alt,
        }
        return result
      }
      case 'imageReference': {
        const u = o as MdastImageReference
        const ref = meta.definitions[u.identifier]
        const result: MdocImage = {
          type: 'image',
          src: resolveUrl(ref.url),
          title: ref.title,
          alt: u.alt,
        }
        return result
      }
      case 'inlineCode': {
        const u = o as MdastCode
        const result: MdocInlineCode = {
          type: 'inlineCode',
          value: u.value,
        }
        return result
      }
      case 'inlineMath': {
        const result: MdocInlineMath = {
          type: 'inlineMath',
          value: o.value as string,
        }
        return result
      }
      case 'link': {
        const u = o as MdastLink
        const result: MdocLink = {
          type: 'link',
          url: resolveUrl(u.url),
          title: u.title,
          children: resolveChildren<MdocStaticPhrasingContent>(),
        }
        return result
      }
      case 'linkReference': {
        const u = o as MdastLinkReference
        const ref = meta.definitions[u.identifier]
        const result: MdocLink = {
          type: 'link',
          url: resolveUrl(ref.url),
          title: ref.title,
          children: resolveChildren<MdocStaticPhrasingContent>(),
        }
        return result
      }
      case 'list': {
        const u = o as MdastList
        const result: MdocList = {
          type: 'list',
          ordered: Boolean(u.ordered),
          start: u.start,
          spread: Boolean(u.spread),
          children: resolveChildren<MdocListContent>(),
        }
        return result
      }
      case 'listItem': {
        const u = o as MdastListItem
        const result: MdocListItem = {
          type: 'listItem',
          checked: u.checked,
          spread: Boolean(u.spread),
          children: resolveChildren(),
        }
        return result
      }
      case 'paragraph': {
        const result: MdocParagraph = {
          type: 'paragraph',
          children: resolveChildren<MdocPhrasingContent>(),
        }
        return result
      }
      case 'strong': {
        const result: MdocStrong = {
          type: 'strong',
          children: resolveChildren<MdocPhrasingContent>(),
        }
        return result
      }
      case 'table': {
        const u = o as MdastTable

        const children = resolveChildren()
        const rows = children!.map((row, index): any => {
          return {
            ...row,
            children: (row as any).children.map((c: any, index: number) => ({
              isHeader: index <= 0,
              align: u.align![index],
              ...c,
            }))
          }
        })

        const result: MdocTable = {
          type: 'table',
          children: rows,
        }
        return result
      }
      case 'tableCell': {
        const { align, isHeader } = o as any
        const result: MdocTableCell = {
          type: 'tableCell',
          isHeader,
          align,
          children: resolveChildren<MdocPhrasingContent>(),
        }
        return result
      }
      case 'tableRow': {
        const result: MdocTableRow = {
          type: 'tableRow',
          children: resolveChildren<MdocRowContent>(),
        }
        return result
      }
      case 'text': {
        const u = o as MdastText
        const result: MdocText = {
          type: 'text',
          value: u.value,
        }
        return result
      }
      case 'thematicBreak': {
        const result: MdocThematicBreak = {
          type: 'thematicBreak',
        }
        return result
      }
      default: {
        if (fallbackParser != null) {
          return fallbackParser(o)
        }
        const { position, ...data } = o
        return data
      }
    }
  }

  const children = (root.children || []).map(resolve)
  const result: MdDocument = {
    toc,
    meta,
    ast: {
      type: 'root',
      children,
    }
  }
  return result
}
