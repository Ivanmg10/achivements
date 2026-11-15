import { Session } from "next-auth";
import { gameKey } from "@/utils/gameRef";
import { candidateToGroupItemBody, type GameCandidate } from "@/utils/gameCandidates";

/** Unlinks the RA account; says whether it worked, so the caller can tell the user. */
export const unlinkRaUser = async (
  update: () => Promise<Session | null>,
): Promise<boolean> => {
  try {
    const res = await fetch('/api/unlinkRaUser', { method: 'POST' })
    if (!res.ok) throw new Error('Failed to unlink RA user')
    await update()
    return true
  } catch (err) {
    console.error('[unlinkRaUser]', err)
    return false
  }
};

/**
 * An RA game looked up by id, as a picker candidate — for pasting an id to
 * pin or group a game outside the user's own lists. Null when RA has no such
 * game or the lookup fails.
 */
export const fetchRaCandidateById = async (id: number): Promise<GameCandidate | null> => {
  try {
    const res = await fetch(`/api/getGameData?gameId=${id}`)
    if (!res.ok) throw new Error(`Game lookup failed (${res.status})`)
    const data = await res.json()
    if (!data?.Title) return null
    return {
      key: gameKey('ra', id),
      source: 'ra',
      id,
      title: data.Title,
      subtitle: data.ConsoleName ?? '',
      imageRef: data.ImageIcon ?? '',
      pctWon: 0,
      numAwarded: 0,
      maxPossible: data.NumAchievements ?? 0,
      status: null,
    }
  } catch (err) {
    console.error('[fetchRaCandidateById]', id, err)
    return null
  }
};

/**
 * Adds a new group's first games (RA or Steam) in parallel. One failed add
 * does not stop the others; returns the candidates that could not be added.
 */
export const addGamesToGroup = async (groupId: number, games: GameCandidate[]): Promise<GameCandidate[]> => {
  const results = await Promise.allSettled(
    games.map(async (g) => {
      const res = await fetch(`/api/groups/${groupId}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidateToGroupItemBody(g)),
      })
      if (!res.ok) throw new Error(`Failed to add game ${g.key} (${res.status})`)
    }),
  )
  const failed: GameCandidate[] = []
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error('[addGamesToGroup]', r.reason)
      failed.push(games[i])
    }
  })
  return failed
}
