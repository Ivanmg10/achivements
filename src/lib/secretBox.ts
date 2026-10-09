import crypto from 'crypto'

/**
 * Encrypts small secrets for storage (AES-256-GCM), keyed from
 * NEXTAUTH_SECRET so the database alone does not give them away. Changing
 * NEXTAUTH_SECRET makes what was stored unreadable: open() then returns null
 * and the caller treats it as missing.
 */

function key(purpose: string): Buffer {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET is not configured')
  return crypto.createHash('sha256').update(`${secret}:${purpose}`).digest()
}

/** "iv.tag.ciphertext", base64url each. */
export function seal(plain: string, purpose: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key(purpose), iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64url')).join('.')
}

export function open(sealed: string | null | undefined, purpose: string): string | null {
  if (!sealed) return null
  try {
    const [iv, tag, data] = sealed.split('.').map((p) => Buffer.from(p, 'base64url'))
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(purpose), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}
