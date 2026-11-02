import crypto from 'crypto'
import { open, seal } from '@/lib/secretBox'

/**
 * Users' RetroAchievements keys at rest: sealed, so the database alone does not
 * give them away. Changing NEXTAUTH_SECRET makes them unreadable, and everyone
 * links RA again. `raid_hash` is what stays comparable, for "one key, one account".
 */
const PURPOSE = 'ra-key'

export function raKeyHash(key: string): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET is not configured')
  return crypto.createHmac('sha256', `${secret}:${PURPOSE}:hash`).update(key).digest('hex')
}

export function sealRaKey(key: string): { sealed: string; hash: string } {
  return { sealed: seal(key, PURPOSE), hash: raKeyHash(key) }
}

/** The key a `raid` column holds. One stored before sealing has no dots, and reads as it is. */
export function readRaKey(stored: string | null | undefined): string | null {
  if (!stored) return null
  return stored.includes('.') ? open(stored, PURPOSE) : stored
}
