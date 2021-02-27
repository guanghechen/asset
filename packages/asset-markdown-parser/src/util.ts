import type { MdocPhrasingContent } from './types/mdoc'

/**
 * Calc link identifier for heading
 */
export function calcIdentifierForHeading(
  contents: MdocPhrasingContent[],
): string {
  const textList: string[] = []

  const resolveText = (nodes: MdocPhrasingContent[]): void => {
    for (const o of nodes) {
      const { value, children } = o as any
      if (value != null) {
        textList.push(value)
      } else if (children != null) {
        resolveText(children)
      }
    }
  }

  resolveText(contents)
  const content = textList.join('-').trim()
  const identifier = content
    .toLowerCase()
    .replace(/(?:\s|\p{P})+/gu, '-')
    .replace(/(?:^[-]|[-]$)/g, '')
  return 'heading-' + identifier
}
