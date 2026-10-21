/**
 * The browser preferences that follow the account (users.preferences), and the
 * only keys the server will store: a client cannot save anything else there.
 * Device-bound things (the language, the cookie choice, the last tab open, the
 * folded sections) stay in the browser.
 */
const KEY =
  /^(?:hidden-consoles:(?:ra|steam|psn|xbox)|library-(?:layout|view|cols)|groups-view|group-detail-view|library-sort(?:-all)?:[A-Za-z]{1,32}|psn-completion|psn-hidden-trophies|xbox-secret-achievements)$/

export const MAX_PREFERENCE_VALUE = 4000
/** A generous ceiling: one sort per category and platform, a console list each. */
export const MAX_PREFERENCE_KEYS = 60

export function isSyncedKey(key: string): boolean {
  return KEY.test(key)
}

export type PreferenceChanges = { set: Record<string, string>; remove: string[] }

/**
 * A request body read as changes: `{ changes: { [key]: string | null } }`, a
 * string to save and null to forget. Null when anything in it is not allowed —
 * a key outside the list, a value that is not a short string — so a bad
 * request changes nothing.
 */
export function readPreferenceChanges(body: unknown): PreferenceChanges | null {
  const changes = (body as { changes?: unknown } | null)?.changes
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) return null
  const entries = Object.entries(changes as Record<string, unknown>)
  if (entries.length === 0 || entries.length > MAX_PREFERENCE_KEYS) return null
  const set: Record<string, string> = {}
  const remove: string[] = []
  for (const [key, value] of entries) {
    if (!isSyncedKey(key)) return null
    if (value === null) remove.push(key)
    else if (typeof value === 'string' && value.length <= MAX_PREFERENCE_VALUE) set[key] = value
    else return null
  }
  return { set, remove }
}

/** What the database holds, kept to what may be sent back: only synced keys with string values. */
export function cleanStoredPreferences(stored: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return out
  for (const [key, value] of Object.entries(stored as Record<string, unknown>)) {
    if (isSyncedKey(key) && typeof value === 'string' && value.length <= MAX_PREFERENCE_VALUE) out[key] = value
  }
  return out
}
