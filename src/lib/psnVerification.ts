import { randomInt } from 'crypto'

/**
 * Proving a PSN account is the user's: a code they paste in the account's About Me (#176). The code is short
 * enough to type, has no look-alike characters (0/O, 1/I), and lives 24 hours.
 */
export const PSN_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8
const PREFIX = 'CV-'

export function makePsnVerificationCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)]
  return PREFIX + code
}

/** Upper case, letters and digits only: a code still counts when About Me wraps it, spaces it or lowercases it. */
export function normalizePsnVerification(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/** Whether About Me holds the code. An empty code never matches. */
export function aboutMeHasCode(aboutMe: string | null | undefined, code: string | null | undefined): boolean {
  const wanted = normalizePsnVerification(code ?? '')
  return wanted.length > 0 && normalizePsnVerification(aboutMe ?? '').includes(wanted)
}

/** When a code made now stops being valid. */
export const psnVerificationExpiry = (now = Date.now()): Date => new Date(now + PSN_VERIFICATION_TTL_MS)
