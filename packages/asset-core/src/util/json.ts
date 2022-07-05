export const cloneJson = <T>(data: T): T => {
  const content = JSON.stringify(data)
  return JSON.parse(content)
}

export const list2map = <T, K extends string, V>(
  entities: ReadonlyArray<T>,
  getKey: (entity: T) => K,
  getValue: (entity: T) => V,
): Map<K, V> => {
  const result: Map<K, V> = new Map()
  for (const entity of entities) {
    const key = getKey(entity)
    const value = getValue(entity)
    result.set(key, value)
  }
  return result
}
