import path from 'path'
import stripAnsi from 'strip-ansi'

const WORKSPACE_ROOT_DIR = path.resolve(__dirname, '../..')


/**
 *
 * @param key
 * @param value
 */
export const assetDataReplacer = (key: string, value: unknown): unknown | undefined => {
  if (['createAt', 'lastModifiedTime', 'updateAt'].includes(key)) {
    return '<' + typeof value + '>'
  }
  return typeof value === 'string' ? stripAnsi(value) : value
}


/**
 * Remove sensitive data
 *
 * @param data
 */
export function desensitize<D extends unknown = unknown>(
  data: D,
  replacer?: (key: string, value: unknown) => unknown | undefined,
): D {
  // No replaceAll, so use .split().join as a alternative
  const str = JSON.stringify(data, replacer)
    .split(WORKSPACE_ROOT_DIR)
    .join('<PACKAGE_ROOT_DIR>')
  return JSON.parse(str)
}
