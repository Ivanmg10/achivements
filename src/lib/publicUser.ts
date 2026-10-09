import pool from '@/lib/db'

/** What another user may see of an account: no email, no keys, no hash. */
export type PublicUserRow = {
  id: number
  username: string
  avatar: string | null
  description: string | null
  location: string | null
  rausername: string | null
  steamid: string | null
  psnaccountid: string | null
  /** Whether their RA key is stored, so their RA data can be read for them. Never the key itself. */
  hasRaKey: boolean
  /** Whether other users may find and open their profile. */
  profilePublic: boolean
}

/** A CheevoVault user by name, case-insensitively; null if there is none. */
export async function findPublicUser(username: string): Promise<PublicUserRow | null> {
  const { rows } = await pool.query(
    `SELECT id, username, avatar, description, location, rausername, steamid, psnaccountid,
            (raid IS NOT NULL) AS "hasRaKey", profile_public AS "profilePublic"
     FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
    [username],
  )
  return (rows[0] as PublicUserRow | undefined) ?? null
}

/**
 * The same user with their RA key, for reading THEIR data on their behalf
 * (see dataOwner). Server-side only: nothing built from this row may be sent
 * to a client.
 */
export async function findSubject(username: string): Promise<(PublicUserRow & { raid: string | null }) | null> {
  const { rows } = await pool.query(
    `SELECT id, username, avatar, description, location, rausername, steamid, psnaccountid, raid,
            (raid IS NOT NULL) AS "hasRaKey", profile_public AS "profilePublic"
     FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
    [username],
  )
  return (rows[0] as (PublicUserRow & { raid: string | null }) | undefined) ?? null
}
