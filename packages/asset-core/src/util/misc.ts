export const cloneJson = <T>(data: T): T => {
  const content = JSON.stringify(data)
  return JSON.parse(content)
}

export const list2map = <T, K extends string, V>(
  entities: ReadonlyArray<T>,
  getKey: (entity: T) => K,
  getValue: (entity: T) => V,
  mp?: Map<K, V>,
): Map<K, V> => {
  const result: Map<K, V> = mp ?? new Map()
  for (const entity of entities) {
    const key = getKey(entity)
    const value = getValue(entity)
    result.set(key, value)
  }
  return result
}

export const uniqueStrings = (texts: Array<string | undefined | null>): string[] => {
  const result: Set<string> = new Set()
  for (const text of texts) {
    if (text != null) result.add(text)
  }
  return Array.from(result)
}
