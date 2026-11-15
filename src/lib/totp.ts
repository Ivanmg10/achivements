import crypto from 'crypto'

/** Time-based one-time passwords (RFC 6238, the SHA-1 form every authenticator app uses). */
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const STEP_S = 30
const DIGITS = 6
/** A phone's clock a little off still works: the step before and the one after. */
const DRIFT = 1

function fromBase32(text: string): Buffer {
  let bits = ''
  for (const c of text.toUpperCase().replace(/=+$/, '')) bits += BASE32.indexOf(c).toString(2).padStart(5, '0')
  return Buffer.from((bits.match(/.{8}/g) ?? []).map((b) => parseInt(b, 2)))
}

function toBase32(bytes: Buffer): string {
  const bits = [...bytes].map((b) => b.toString(2).padStart(8, '0')).join('')
  return (bits.match(/.{1,5}/g) ?? []).map((b) => BASE32[parseInt(b.padEnd(5, '0'), 2)]).join('')
}

export function newTotpSecret(): string {
  return toBase32(crypto.randomBytes(20))
}

/** The code of a step (a 30-second window since the epoch). */
export function totpCode(secret: string, step: number): string {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(step))
  const hmac = crypto.createHmac('sha1', fromBase32(secret)).update(counter).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  return String((hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** DIGITS).padStart(DIGITS, '0')
}

/** The step a code belongs to around this moment, or null when it is not a good code. */
export function matchingStep(secret: string, code: string, now = Date.now()): number | null {
  if (!/^\d{6}$/.test(code)) return null
  const current = Math.floor(now / 1000 / STEP_S)
  for (let step = current - DRIFT; step <= current + DRIFT; step++) {
    if (crypto.timingSafeEqual(Buffer.from(totpCode(secret, step)), Buffer.from(code))) return step
  }
  return null
}

/** What an authenticator app takes to add the account. */
export function totpUri(secret: string, account: string): string {
  const params = new URLSearchParams({ secret, issuer: 'CheevoVault', digits: String(DIGITS), period: String(STEP_S) })
  return `otpauth://totp/${encodeURIComponent(`CheevoVault:${account}`)}?${params}`
}
