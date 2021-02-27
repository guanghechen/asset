import fs from 'fs-extra'
import path from 'path'

/**
 * Ensure the dirpath exists
 * @param dirpath
 */
export function ensurePathExists(dirpath: string): void {
  if (!fs.existsSync(dirpath)) {
    fs.mkdirsSync(dirpath)
  }
}

/**
 * Output into file
 *
 * @param filepath
 * @param data
 */
export async function writeFile(filepath: string, data: Buffer): Promise<void> {
  ensurePathExists(path.dirname(filepath))
  await fs.writeFile(filepath, data)
}

/**
 * Output into file (synchronous)
 *
 * @param filepath
 * @param data
 */
export function writeFileSync(filepath: string, data: Buffer): void {
  ensurePathExists(path.dirname(filepath))
  fs.writeFileSync(filepath, data)
}

/**
 * Output into json file
 *
 * @param filepath
 * @param data
 */
export async function writeJSON<T extends unknown = unknown>(
  filepath: string,
  data: T,
): Promise<T> {
  ensurePathExists(path.dirname(filepath))
  await fs.writeJSON(filepath, data)
  return data
}

/**
 * Output into json file (synchronous)
 *
 * @param filepath
 * @param data
 */
export function writeJSONSync<T extends unknown = unknown>(
  filepath: string,
  data: T,
): T {
  ensurePathExists(path.dirname(filepath))
  fs.writeJSONSync(filepath, data)
  return data
}
