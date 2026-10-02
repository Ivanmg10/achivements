import { getUserProfile } from '@/lib/raClient'

const MAX_PAYLOAD_SIZE = 10_000
const RA_FIELD_MAX = 100

type RaProfile = Record<string, unknown> & { User?: unknown }

export type RaProfileResult =
  | { ok: true; profile: RaProfile }
  | { ok: false; error: 'ra-invalid' | 'ra-unavailable'; status: 400 | 502 }

/** Whether a username and key are worth asking RA about at all. */
export function validRaCredentials(username: unknown, apiKey: unknown): username is string {
  return (
    typeof username === 'string' && typeof apiKey === 'string' &&
    Boolean(username.trim()) && Boolean(apiKey.trim()) &&
    username.length <= RA_FIELD_MAX && apiKey.length <= RA_FIELD_MAX
  )
}

/**
 * Asks RA itself for the profile, with that user's own key. Nothing about the
 * account is taken from whoever is asking but the username and key: what gets
 * stored is what RA answered. A 4xx from RA means the username or key is wrong
 * (400); anything else is RA being unavailable (502).
 */
export async function fetchRaProfile(username: string, apiKey: string): Promise<RaProfileResult> {
  let profile: unknown
  try {
    profile = await getUserProfile(username, apiKey)
  } catch (err) {
    const status = (err as { status?: number }).status
    if (status && status >= 400 && status < 500) return { ok: false, error: 'ra-invalid', status: 400 }
    console.error('[raProfile] RA lookup', err)
    return { ok: false, error: 'ra-unavailable', status: 502 }
  }

  if (!profile || typeof profile !== 'object' || Array.isArray(profile) || !(profile as RaProfile).User) {
    return { ok: false, error: 'ra-invalid', status: 400 }
  }
  if (JSON.stringify(profile).length > MAX_PAYLOAD_SIZE) {
    return { ok: false, error: 'ra-invalid', status: 400 }
  }
  return { ok: true, profile: profile as RaProfile }
}
