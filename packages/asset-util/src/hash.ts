import crypto from 'node:crypto'

/**
 * Calc hash value with sha1 algorithm
 *
 * @param content
 */
export function calcFingerprint(content: string | Buffer | undefined): string {
  if (content === undefined) return ''

  const sha1 = crypto.createHash('sha1')
  sha1.update(content)
  return sha1.digest('hex')
}
