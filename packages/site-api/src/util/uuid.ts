import crypto from 'crypto'


/**
 * create uuid
 * @param content
 */
export function calcUUID(content: string): string {
  const sha1 = crypto.createHash('sha1')
  sha1.update(content.toString().trim())
  return sha1.digest('hex')
}


/**
 * calc fingerprint of content
 * @param content
 */
export function calcFingerprint(content: Buffer): string {
  const sha1 = crypto.createHash('sha1')
  sha1.update(content)
  return sha1.digest('hex')
}
