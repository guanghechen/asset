/**
 * Check if the two list collection contains same elements.
 * @param a
 * @param b
 * @returns
 */
export const isSameSet = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false

  const _size: number = a.length
  if (_size < 0) return false
  if (_size === 0) return true
  if (_size === 1) return a[0] === b[0]

  const set: Set<T> = new Set(a)
  return b.every(x => set.has(x))
}
