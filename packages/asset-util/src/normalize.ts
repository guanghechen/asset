export function normalizePattern(
  pattern: RegExp | RegExp[] | ((input: string) => boolean) | null | undefined,
): ((input: string) => boolean) | null | never {
  if (pattern == null) return null
  if (pattern instanceof RegExp) return text => pattern.test(text)
  if (pattern instanceof Function) return pattern

  if (Array.isArray(pattern)) {
    if (!pattern.every(p => p instanceof RegExp)) {
      throw new Error('[normalizePattern] Bad pattern, not all elements are regular expression.')
    }
    return text => pattern.every(p => p.test(text))
  }

  throw new Error('[normalizePattern] Unexpected pattern.')
}

export function normalizeUrlPath(urlPath: string): string {
  const isAbsolute = urlPath.startsWith('/')
  const pieces = urlPath
    .split(/[/\\]+/g)
    .map(x => x.trim())
    .filter(piece => !!piece)
  const pieceStack: string[] = []
  for (const piece of pieces) {
    if (/^\./.test(piece)) {
      if (piece === '.') {
        if (pieceStack.length > 0) continue
      } else if (piece === '..') {
        if (pieceStack.length > 0) {
          pieceStack.pop()
          continue
        }
      }
    }
    pieceStack.push(piece)
  }
  const p = pieceStack.join('/')
  return isAbsolute ? '/' + p : p
}
