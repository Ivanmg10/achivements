import pool from '@/lib/db'
import { gameKey, isGameSource } from '@/utils/gameRef'
import { presenceColumns } from '@/lib/presence'
import { readRaKey } from '@/lib/raKey'

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
  xboxxuid: string | null
  /** Whether their RA key is stored, so their RA data can be read for them. Never the key itself. */
  hasRaKey: boolean
  /** Whether other users may find and open their profile. */
  profilePublic: boolean
}

type SavedGame = { id: number; title: string; imageIcon: string } | null

/** What their public page shows besides: names on each platform and their preferences. */
export type PublicProfileRow = PublicUserRow & {
  /** Only for who shares it; see presenceColumns. */
  online: boolean
  lastSeenAt: string | null
  steamusername: string | null
  psnusername: string | null
  xboxgamertag: string | null
  theme: string | null
  gender: 'male' | 'female' | 'neutral' | null
  /** Whether they chose to show the gender; when false it must not leave the server. */
  genderPublic: boolean
  favorite_game: SavedGame
  favorite_steam_game: SavedGame
  favorite_psn_game: SavedGame
  favorite_xbox_game: SavedGame
}

/** A CheevoVault user by name, case-insensitively; null if there is none. */
export async function findPublicUser(username: string): Promise<PublicProfileRow | null> {
  // Postgres refuses a NUL in text, and no username has one.
  if (username.includes('\0')) return null
  const { rows } = await pool.query(
    `SELECT id, username, avatar, description, location, rausername, steamid, psnaccountid, xboxxuid,
            steamusername, psnusername, xboxgamertag, theme, gender, gender_public AS "genderPublic",
            favorite_game, favorite_steam_game, favorite_psn_game, favorite_xbox_game,
            (raid IS NOT NULL) AS "hasRaKey", profile_public AS "profilePublic",
            ${presenceColumns()}
     FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
    [username],
  )
  return (rows[0] as PublicProfileRow | undefined) ?? null
}

/**
 * The games a user hid from their lists, as "source:id" keys, so their page
 * leaves them out too. Hiding is tidying, not secrecy: these are games their
 * platform profiles already show.
 */
export async function hiddenGameKeys(userId: number): Promise<string[]> {
  const { rows } = await pool.query('SELECT source, game_id FROM hidden_games WHERE user_id = $1', [userId])
  return (rows as { source: string; game_id: number }[])
    .filter((r) => isGameSource(r.source))
    .map((r) => gameKey(r.source as 'ra', r.game_id))
}

/**
 * The same user with their RA key, for reading THEIR data on their behalf
 * (see dataOwner). Server-side only: nothing built from this row may be sent
 * to a client.
 */
export async function findSubject(username: string): Promise<(PublicUserRow & { raid: string | null; xboxgamertag: string | null }) | null> {
  if (username.includes('\0')) return null
  const { rows } = await pool.query(
    `SELECT id, username, avatar, description, location, rausername, steamid, psnaccountid, xboxxuid, xboxgamertag, raid,
            (raid IS NOT NULL) AS "hasRaKey", profile_public AS "profilePublic"
     FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
    [username],
  )
  const row = rows[0] as (PublicUserRow & { raid: string | null; xboxgamertag: string | null }) | undefined
  return row ? { ...row, raid: readRaKey(row.raid) } : null
}
