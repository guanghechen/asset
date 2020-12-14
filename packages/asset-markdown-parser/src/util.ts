import type {
  MdastPropsPhrasingContent,
  MdastPropsRoot,
} from './types/mdast-props'


/**
 * Calc link identifier for heading
 */
export function calcIdentifierForHeading(contents: MdastPropsPhrasingContent[]): string {
  const textList: string[] = []

  const resolveText = (nodes: MdastPropsPhrasingContent[]): void => {
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
  const identifier = content.toLowerCase()
    .replace(/(?:\s|\p{P})+/gu, '-')
    .replace(/(?:^[-]|[-]$)/g, '')
  return 'heading-' + identifier
}


/**
 * Create empty mdast props root
 */
export function createEmptyMdastPropsRoot(): MdastPropsRoot {
  return {
    type: 'root',
    meta: {
      definitions: {},
      toc: [],
    },
    children: [],
  }
}
