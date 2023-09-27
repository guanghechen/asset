import path from 'node:path'

const urlRegex = /^\w+:\/\//

/**
 * Check if the given filepath is an absolute path.
 * @param filepath
 */
export function isAbsolutePath(filepath: string): boolean {
  if (path.isAbsolute(filepath)) return true
  if (urlRegex.test(filepath)) return true
  return false
}
