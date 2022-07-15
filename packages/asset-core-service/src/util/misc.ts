/**
 * Verify if the given obj is an array which all elements are of type T.
 * @param obj
 * @param check
 * @returns
 */
export const isArrayOfT = <T>(obj: unknown, check: (el: unknown) => el is T): obj is T[] => {
  return Array.isArray(obj) ? obj.every(check) : false
}

/**
 * Verify if the given obj is an array which all elements are of type T[].
 * @param obj
 * @param check
 * @returns
 */
export const isTwoDimensionArrayOfT = <T>(
  obj: unknown,
  check: (el: unknown) => el is T,
): obj is T[][] => {
  return Array.isArray(obj) ? obj.every(el => isArrayOfT(el, check)) : false
}

export const normalizeRelativeUrlPath = (relativeUrlPath: string): string => {
  return relativeUrlPath
    .split(/[/\\]/g)
    .map(x => x.trim())
    .filter(x => !!x)
    .join('/')
}
