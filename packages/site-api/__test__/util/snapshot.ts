import path from 'path'


const WORKSPACE_ROOT_DIR = path.resolve(__dirname, '../..')


/**
 * Remove sensitive data
 *
 * @param data
 */
export function desensitize<D extends unknown = unknown>(data: D): D {
  // No replaceAll, so use .split().join as a alternative
  const str = JSON.stringify(data)
    .split(WORKSPACE_ROOT_DIR).join('<PACKAGE_ROOT_DIR>')
  return JSON.parse(str)
}
