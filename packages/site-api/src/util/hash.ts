import crypto from 'crypto'

/**
 * Calc hash value with sha1 algorithm
 *
 * @param content
 */
export function sha1(content: string | Buffer): string {
  const sha1 = crypto.createHash('sha1')
  sha1.update(content)
  return sha1.digest('hex')
}


/**
 * calc fingerprint of content
 * @param content
 */
export function calcFingerprint(content: Buffer): string {
  return sha1(content)
}


/**
 * Generate unique id from text
 *
 * @param text
 */
export function uniqueText(
  text: string | null,
): typeof text extends null ? null : string {
  if (text == null) return null as any
  return text.toLowerCase().trim().replace(/[\s\n]+/g, '--')
}
