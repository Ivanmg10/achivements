/**
 * The RetroAchievements game a person pasted into a search box: a bare id (three digits or more, so "42"
 * stays a title search) or a `retroachievements.org/game/<id>` link. `null` when the text is neither.
 */
export function parseRaGameId(text: string): number | null {
  const q = text.trim()
  const id = /^\d{3,}$/.test(q) ? q : q.match(/retroachievements\.org\/game\/(\d+)/i)?.[1]
  const parsed = id ? parseInt(id, 10) : 0
  return parsed > 0 ? parsed : null
}
