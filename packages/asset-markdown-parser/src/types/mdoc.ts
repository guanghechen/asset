import type {
  Definition as MdastDefinition,
  TableAlignType,
} from '@yozora/parser-gfm'

/**
 * Anchor data of toc (Table of Contents)
 */
export interface MdDocumentTocAnchor {
  /**
   * Anchor id
   */
  id: string
  /**
   * Anchor title
   */
  title: MdocPhrasingContent[]
  /**
   * Sub anchors
   */
  children?: MdDocumentTocAnchor[]
}

/**
 * Table of contents of Markdown Document
 */
export interface MdDocumentToc {
  /**
   * Anchors of toc
   */
  anchors: MdDocumentTocAnchor[]
}

/**
 * Meta data of Markdown Document
 */
export interface MdDocumentMeta {
  /**
   * Definition map
   */
  definition: Record<string, MdastDefinition>
}

/**
 * Markdown document
 */
export interface MdDocument {
  /**
   * Table of contents of Markdown Document
   */
  toc: MdDocumentToc
  /**
   * Meta data of Markdown Document
   */
  meta: MdDocumentMeta
  /**
   * Markdown ast
   */
  ast: MdocRoot
}

/**
 * Mdast props ast
 */
export interface MdocRoot {
  /**
   * Root node
   */
  type: 'root'
  /**
   * Child nodes
   */
  children: MdocNode[]
}

export type MdocContent =
  | MdocTopLevelContent
  | MdocListContent
  | MdocTableContent
  | MdocRowContent
  | MdocPhrasingContent

export type MdocTopLevelContent = MdocBlockContent

export type MdocBlockContent =
  | MdocParagraph
  | MdocHeading
  | MdocThematicBreak
  | MdocBlockquote
  | MdocList
  | MdocTable
  | MdocCode

export type MdocListContent = MdocListItem

export type MdocTableContent = MdocTableRow

export type MdocRowContent = MdocTableCell

export type MdocPhrasingContent =
  | MdocStaticPhrasingContent
  | MdocLink
  | MdocLinkReference

export type MdocStaticPhrasingContent =
  | MdocText
  | MdocEmphasis
  | MdocStrong
  | MdocDelete
  | MdocInlineCode
  | MdocBreak
  | MdocImage
  | MdocImageReference
  | MdocFootnote
  | MdocFootnoteReference

/**
 *
 */
export interface MdocNode {
  /**
   * Data node type
   */
  type: string
}

export interface MdocParent extends MdocNode {
  children: MdocNode[]
}

export interface MdocLiteral extends MdocNode {
  value: string
}

/**
 * Blockquote
 */
export interface MdocBlockquote extends MdocParent {
  type: 'blockquote'
  children: MdocBlockContent[]
}

/**
 * Break
 */
export interface MdocBreak extends MdocNode {
  type: 'break'
}

/**
 * Code
 */
export interface MdocCode extends MdocLiteral {
  type: 'code'
  /**
   * Language of code
   */
  lang?: string
  /**
   * Meta data of code
   */
  meta?: string
  /**
   * Parsed meta data
   */
  args: Record<string, unknown>
}

/**
 * Similar to Code, but render code as a prepared component
 */
export interface MdocCodeEmbed extends Omit<MdocCode, 'type'> {
  type: 'codeEmbed'
}

/**
 * Similar to Code, but create a live editor for both editing and preview
 */
export interface MdocCodeLive extends Omit<MdocCode, 'type'> {
  type: 'codeLive'
}

/**
 * Delete
 */
export interface MdocDelete extends MdocParent {
  type: 'delete'
  children: MdocPhrasingContent[]
}

/**
 * Emphasis
 */
export interface MdocEmphasis extends MdocParent {
  type: 'emphasis'
  children: MdocPhrasingContent[]
}

/**
 * Footnote
 */
export interface MdocFootnote extends MdocParent {
  type: 'footnote'
  children: MdocPhrasingContent[]
}

/**
 * FootnoteReference
 */
export interface MdocFootnoteReference extends MdocParent {
  type: 'footnoteReference'
  children: MdocPhrasingContent[]
}

/**
 * Heading
 */
export interface MdocHeading extends MdocParent {
  type: 'heading'
  level: 1 | 2 | 3 | 4 | 5 | 6
  identifier: string
  children: MdocPhrasingContent[]
}

/**
 * Image
 */
export interface MdocImage extends MdocNode {
  type: 'image'
  src: string
  title?: string
  alt?: string
}

/**
 * ImageReference
 */
export interface MdocImageReference extends MdocNode {
  type: 'imageReference'
  url: string
  title?: string
  alt?: string
}

/**
 * InlineCode
 */
export interface MdocInlineCode extends MdocLiteral {
  type: 'inlineCode'
}

/**
 * InlineMath
 */
export interface MdocInlineMath extends MdocLiteral {
  type: 'inlineMath'
}

/**
 * Link
 */
export interface MdocLink extends MdocParent {
  type: 'link'
  url: string
  title?: string
  children: MdocStaticPhrasingContent[]
}

/**
 * Link reference
 */
export interface MdocLinkReference extends MdocParent {
  type: 'linkReference'
  url: string
  title?: string
  children: MdocStaticPhrasingContent[]
}

/**
 * List
 */
export interface MdocList extends MdocParent {
  type: 'list'
  ordered: boolean
  start?: number
  spread: boolean
  children: MdocListContent[]
}

/**
 * List item
 */
export interface MdocListItem extends MdocParent {
  type: 'listItem'
  status?: 'todo' | 'doing' | 'done'
  checked?: boolean
}

/**
 * Paragraph
 */
export interface MdocParagraph extends MdocParent {
  type: 'paragraph'
  children: MdocPhrasingContent[]
}

/**
 * Strong
 */
export interface MdocStrong extends MdocParent {
  type: 'strong'
  children: MdocPhrasingContent[]
}

/**
 * Table
 */
export interface MdocTable extends MdocNode {
  type: 'table'
  children: MdocTableRow[]
}

/**
 * Table cell
 */
export interface MdocTableCell extends MdocParent {
  type: 'tableCell'
  isHeader: boolean
  align?: TableAlignType
  children: MdocPhrasingContent[]
}

/**
 * Table row
 */
export interface MdocTableRow extends MdocParent {
  type: 'tableRow'
  children: MdocRowContent[]
}

/**
 * Text
 */
export interface MdocText extends MdocLiteral {
  type: 'text'
}

/**
 * Thematic break
 */
export interface MdocThematicBreak extends MdocNode {
  type: 'thematicBreak'
}
