import { AlignType } from 'mdast'
import type { MdastDefinition } from '../mdast/types'


// Symbol will be lost when convert to json data
export const DESCENDANT_KEYS = 'DESCENDANT_KEYS'


export type PropsAstContent =
  | PropsAstTopLevelContent
  | PropsAstListContent
  | PropsAstTableContent
  | PropsAstRowContent
  | PropsAstPhrasingContent

export type PropsAstTopLevelContent = PropsAstBlockContent

export type PropsAstBlockContent =
  | PropsAstParagraph
  | PropsAstHeading
  | PropsAstThematicBreak
  | PropsAstBlockquote
  | PropsAstList
  | PropsAstTable
  | PropsAstCode

export type PropsAstListContent = PropsAstListItem

export type PropsAstTableContent = PropsAstTableRow

export type PropsAstRowContent = PropsAstTableCell

export type PropsAstPhrasingContent =
  | PropsAstStaticPhrasingContent
  | PropsAstLink
  | PropsAstLinkReference

export type PropsAstStaticPhrasingContent =
  | PropsAstText
  | PropsAstEmphasis
  | PropsAstStrong
  | PropsAstDelete
  | PropsAstInlineCode
  | PropsAstBreak
  | PropsAstImage
  | PropsAstImageReference
  | PropsAstFootnote
  | PropsAstFootnoteReference


/**
 *
 */
export interface PropsAstMeta {
  /**
   * definition map
   */
  definitions: Record<string, MdastDefinition>
}


/**
 *
 */
export interface PropsAstNode {
  /**
   * Data node type
   */
  type: string
  /**
   * Property keys pointer to the descendant nodes
   *
   * @default ['children']
   */
  [DESCENDANT_KEYS]?: string[]
  /**
   *
   */
  [key: string]: any
}


export interface PropsAstParent extends PropsAstNode {
  children: PropsAstNode[]
}


export interface PropsAstLiteral extends PropsAstNode {
  value: string
}


/**
 *
 */
export interface PropsAstRoot {
  /**
   * Root node
   */
  type: 'root'
  /**
   * PropsAst meta data
   */
  meta: PropsAstMeta
  /**
   * Child nodes
   */
  children: PropsAstNode[]
}


/**
 * Blockquote
 */
export interface PropsAstBlockquote extends PropsAstParent {
  type: 'blockquote'
  children: PropsAstBlockContent[]
}


/**
 * Break
 */
export interface PropsAstBreak extends PropsAstNode {
  type: 'break'
}


/**
 * Code
 */
export interface PropsAstCode extends PropsAstLiteral {
  type: 'code'
  /**
   * Language of code
   */
  lang?: string
  /**
   * - {'literal'}  display the literal code with highlight (optional)
   * - {'embed'}    render code as a component
   * - {'live'}     create a live editor for both editing and preview
   */
  mode?: 'literal' | 'embed' | 'live'
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
 * Delete
 */
export interface PropsAstDelete extends PropsAstParent {
  type: 'delete'
  children: PropsAstPhrasingContent[]
}


/**
 * Emphasis
 */
export interface PropsAstEmphasis extends PropsAstParent {
  type: 'emphasis'
  children: PropsAstPhrasingContent[]
}


/**
 * Footnote
 */
export interface PropsAstFootnote extends PropsAstParent {
  type: 'footnote'
  children: PropsAstPhrasingContent[]
}


/**
 * FootnoteReference
 */
export interface PropsAstFootnoteReference extends PropsAstParent {
  type: 'footnoteReference'
  children: PropsAstPhrasingContent[]
}


/**
 * Heading
 */
export interface PropsAstHeading extends PropsAstParent {
  type: 'heading'
  level: 1 | 2 | 3 | 4 | 5 | 6
  children: PropsAstPhrasingContent[]
}


/**
 * Image
 */
export interface PropsAstImage extends PropsAstNode {
  type: 'image'
  url: string
  title?: string
  alt?: string
}


/**
 * ImageReference
 */
export interface PropsAstImageReference extends PropsAstNode {
  type: 'imageReference'
  url: string
  title?: string
  alt?: string
}


/**
 * InlineCode
 */
export interface PropsAstInlineCode extends PropsAstLiteral {
  type: 'inlineCode'
}


/**
 * InlineMath
 */
export interface PropsAstInlineMath extends PropsAstLiteral {
  type: 'inlineMath'
}


/**
 * Link
 */
export interface PropsAstLink extends PropsAstParent {
  type: 'link'
  url: string
  title?: string
  children: PropsAstStaticPhrasingContent[]
}


/**
 * Link reference
 */
export interface PropsAstLinkReference extends PropsAstParent {
  type: 'linkReference'
  url: string
  title?: string
  children: PropsAstStaticPhrasingContent[]
}


/**
 * List
 */
export interface PropsAstList extends PropsAstParent {
  type: 'list'
  ordered: boolean
  start?: number
  spread: boolean
  children: PropsAstListContent[]
}


/**
 * List item
 */
export interface PropsAstListItem extends PropsAstParent {
  type: 'listItem'
  checked?: boolean
  spread: boolean
}


/**
 * Paragraph
 */
export interface PropsAstParagraph extends PropsAstParent {
  type: 'paragraph'
  children: PropsAstPhrasingContent[]
}


/**
 * Strong
 */
export interface PropsAstStrong extends PropsAstParent {
  type: 'strong'
  children: PropsAstPhrasingContent[]
}


/**
 * Table
 */
export interface PropsAstTable extends PropsAstNode {
  type: 'table'
  head: PropsAstTableRow
  body: PropsAstTableRow[]
}


/**
 * Table cell
 */
export interface PropsAstTableCell extends PropsAstParent {
  type: 'tableCell'
  align?: AlignType
  children: PropsAstPhrasingContent[]
}


/**
 * Table row
 */
export interface PropsAstTableRow extends PropsAstParent {
  type: 'tableRow'
  children: PropsAstRowContent[]
}


/**
 * Text
 */
export interface PropsAstText extends PropsAstLiteral {
  type: 'text'
}


/**
 * Thematic break
 */
export interface PropsAstThematicBreak extends PropsAstNode {
  type: 'thematicBreak'
}
