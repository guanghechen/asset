import crypto from 'crypto'
import type { IBuffer } from '../types/misc'

/**
 * Calc hash value with sha1 algorithm
 *
 * @param content
 */
export function calcFingerprint(content: string | IBuffer): string {
  const sha1 = crypto.createHash('sha1')
  sha1.update(content)
  return sha1.digest('hex')
}
