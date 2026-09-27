import type { SteamAppDetailsResponse, SteamSchemaAchievement } from '@/types/steam'

/**
 * Steam does not flag achievements that need online play, so this guesses
 * from the English description, helped by the store's list of the game's
 * modes. It is shown as "Online?" — an estimate, not a fact.
 */

/** Store category ids (stable; the names are localised) that mean online play. */
const ONLINE_CATEGORY_IDS = new Set([
  20, // MMO
  27, // Cross-Platform Multiplayer
  36, // Online PvP
  38, // Online Co-op
])
/** Plain Multi-player: online for older games, which predate the categories above… */
const MULTIPLAYER = 1
/** …unless the store says the multiplayer is shared/split screen. */
const LOCAL_CATEGORY_IDS = new Set([24, 37, 39])

/** Words that mean online on their own, whatever the game. */
const STRONG = /\b(online|ranked|matchmaking|lobby|lobbies)\b/i

/** Online unless the store says the game has no online play (then it is split screen). */
const MULTIPLAYER_WORDS = /\b(multi-?player|leaderboards?)\b/i

/** Words that only mean online in a game that has online modes: "win 10 matches". */
const WEAK = /\b(match(es)?|co-?op|cooperative|versus|pvp|opponents?|other players|teammates?|clan|guild|squad|friends?)\b/i

/** Says it is local play, which beats any other hint. */
const LOCAL = /\b(local|split-?screen|offline|couch|same (screen|console))\b/i

/** Whether the store lists an online mode for the game. null: no store entry. */
export function hasOnlineModes(appId: number, data: SteamAppDetailsResponse | null | undefined): boolean | null {
  const entry = data?.[String(appId)]
  if (!entry?.success || !entry.data) return null
  const ids = new Set((entry.data.categories ?? []).map((c) => Number(c.id)))
  if ([...ids].some((id) => ONLINE_CATEGORY_IDS.has(id))) return true
  return ids.has(MULTIPLAYER) && ![...ids].some((id) => LOCAL_CATEGORY_IDS.has(id))
}

/**
 * Whether an achievement probably needs online play. When the store's modes
 * are unknown (`gameIsOnline` null), only the unambiguous words count.
 */
export function isLikelyOnline(description: string, gameIsOnline: boolean | null): boolean {
  if (!description || LOCAL.test(description)) return false
  if (STRONG.test(description)) return true
  if (gameIsOnline !== false && MULTIPLAYER_WORDS.test(description)) return true
  return gameIsOnline === true && WEAK.test(description)
}

/** The apinames of a game's achievements that probably need online play. */
export function likelyOnlineNames(englishSchema: SteamSchemaAchievement[], gameIsOnline: boolean | null): Set<string> {
  return new Set(
    englishSchema
      .filter((a) => isLikelyOnline(`${a.displayName ?? ''} ${a.description ?? ''}`, gameIsOnline))
      .map((a) => a.name),
  )
}
