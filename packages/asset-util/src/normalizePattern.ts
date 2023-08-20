export function normalizePattern(
  pattern: RegExp | RegExp[] | ((input: string) => boolean) | null | undefined,
): ((input: string) => boolean) | null | never {
  if (pattern == null) return null
  if (pattern instanceof RegExp) return text => pattern.test(text)
  if (pattern instanceof Function) return pattern

  if (Array.isArray(pattern)) {
    if (!pattern.every(p => p instanceof RegExp)) {
      throw new Error(`[normalizePattern] Bad pattern, not all elements are regular expression.`)
    }
    return text => pattern.every(p => p.test(text))
  }

  throw new Error(`[normalizePattern] Unexpected pattern.`)
}
