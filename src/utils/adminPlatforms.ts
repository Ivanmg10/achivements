import type { AdminUser } from '@/types/user'
import type { GameSource } from '@/types/game'

type AccountField = 'rausername' | 'ra_display' | 'steamid' | 'steamusername' | 'psnaccountid' | 'psnusername' | 'xboxxuid' | 'xboxgamertag'

/** A box the admin types into to link it; `key` is its name in the POST body. */
export type AdminPlatformInput = { key: string; label: string; placeholder: string; secret?: boolean }

/**
 * Each platform as the admin panel shows it (audit E-10): its name, the user's fields it fills
 * (the linked id first, then the name shown), and what linking it asks for. The panel is in English.
 */
export type AdminPlatform = { source: GameSource; name: string; fields: [AccountField, AccountField]; inputs: AdminPlatformInput[] }

export const ADMIN_PLATFORMS: AdminPlatform[] = [
  {
    source: 'ra',
    name: 'RetroAchievements',
    fields: ['rausername', 'ra_display'],
    inputs: [
      { key: 'username', label: 'RA username', placeholder: 'RA username' },
      { key: 'apiKey', label: 'RA Web API key', placeholder: 'Web API key', secret: true },
    ],
  },
  {
    source: 'steam',
    name: 'Steam',
    fields: ['steamid', 'steamusername'],
    inputs: [{ key: 'steamid', label: 'SteamID64 or profile link', placeholder: 'SteamID64 or steamcommunity.com/profiles/…' }],
  },
  {
    source: 'psn',
    name: 'PSN',
    fields: ['psnaccountid', 'psnusername'],
    inputs: [{ key: 'username', label: 'PSN online ID', placeholder: 'PSN online ID' }],
  },
  {
    source: 'xbox',
    name: 'Xbox',
    fields: ['xboxxuid', 'xboxgamertag'],
    inputs: [{ key: 'gamertag', label: 'Xbox gamertag', placeholder: 'Xbox gamertag' }],
  },
]

/** The linked account as the panel names it (its name, else its id), or null while it is not linked. */
export function adminAccount(user: AdminUser, { fields: [id, name] }: AdminPlatform): string | null {
  return user[id] ? (user[name] ?? user[id] ?? null) : null
}

/** The user's fields after a link (`answer`, the route's JSON) or an unlink (no answer: all null). */
export function adminAccountChanges({ fields }: AdminPlatform, answer?: Record<string, unknown>): Partial<AdminUser> {
  return Object.fromEntries(fields.map((f) => [f, (answer?.[f] as string | null | undefined) ?? null]))
}
