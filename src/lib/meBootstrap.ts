import pool from '@/lib/db'
import { loadVaultMe, type VaultMe } from '@/lib/vaultMe'
import { cleanStoredPreferences } from '@/utils/syncedPreferences'

/** A hidden game as stored: what `/api/hiddenGames` answers. */
export type HiddenGameRow = { source: string; game_id: number; title: string; image: string | null }

/** The account's synced display preferences (users.preferences), cleaned to the keys that may be stored. */
export async function readPreferences(id: string): Promise<Record<string, string>> {
  const { rows } = await pool.query('SELECT preferences FROM users WHERE id = $1', [id])
  return cleanStoredPreferences(rows[0]?.preferences)
}

/** The games the user hid, newest first. */
export async function readHiddenGames(id: string): Promise<HiddenGameRow[]> {
  const { rows } = await pool.query(
    'SELECT source, game_id, title, image FROM hidden_games WHERE user_id = $1 ORDER BY created_at DESC',
    [id],
  )
  return rows
}

/**
 * What every signed-in page reads from CheevoVault itself at start-up, in one
 * answer (#101): preferences, hidden games and Vault Points. Never a platform:
 * it only reads the database, so it is never held up by one. Each part is read
 * on its own; one that fails is null and its reader asks its own route.
 */
export type Bootstrap = {
  preferences: Record<string, string> | null
  hiddenGames: HiddenGameRow[] | null
  vault: VaultMe | null
}

export async function loadBootstrap(id: string, xbox: boolean): Promise<Bootstrap> {
  const [preferences, hiddenGames, vault] = await Promise.allSettled([
    readPreferences(id),
    readHiddenGames(id),
    loadVaultMe(Number(id), xbox),
  ])
  const part = <T,>(result: PromiseSettledResult<T>, name: string): T | null => {
    if (result.status === 'fulfilled') return result.value
    console.error(`[me/bootstrap] ${name}`, result.reason)
    return null
  }
  return { preferences: part(preferences, 'preferences'), hiddenGames: part(hiddenGames, 'hiddenGames'), vault: part(vault, 'vault') }
}
