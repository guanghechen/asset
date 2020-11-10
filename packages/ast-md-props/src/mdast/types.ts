import type { Literal as MdastLiteral } from 'mdast'
export type {
  Blockquote as MdastBlockquote,
  Break as MdastBreak,
  Code as MdastCode,
  Definition as MdastDefinition,
  Delete as MdastDelete,
  Emphasis as MdastEmphasis,
  Footnote as MdastFootnote,
  FootnoteReference as MdastFootnoteReference,
  Heading as MdastHeading,
  Image as MdastImage,
  ImageReference as MdastImageReference,
  InlineCode as MdastInlineCode,
  Link as MdastLink,
  LinkReference as MdastLinkReference,
  List as MdastList,
  ListItem as MdastListItem,
  Paragraph as MdastParagraph,
  Parent as MdastParent,
  Root as MdastRoot,
  Strong as MdastStrong,
  Table as MdastTable,
  TableCell as MdastTableCell,
  TableRow as MdastTableRow,
  Text as MdastText,
  ThematicBreak as MdastThematicBreak,
} from 'mdast'


/**
 * Inline math
 */
export interface MdastMath extends MdastLiteral {
  /**
   *
   */
  type: 'inlineMath'
  /**
   *
   */
  value: string
}