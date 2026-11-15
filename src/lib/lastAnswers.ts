/**
 * The last good answer of each GET a page read, by user and URL, for the time
 * the tab is open: so coming back to a page paints what it showed at once and
 * then reads it again, instead of a skeleton (#101). It never replaces the read:
 * a page always asks, so nothing is ever older than it was before this. Only in
 * the browser (on the server there is nothing, so no one's answer reaches anyone
 * else), and only for the user who read it.
 *
 * Shared by reference, like fetchShared's answers: copy before changing one.
 */
const answers = new Map<string, unknown>()
/** Enough for every page of a session; the oldest go first. */
const MAX = 200

const keyOf = (user: string, url: string) => `${user}\n${url}`

export function lastAnswer<T>(user: string | null | undefined, url: string): T | undefined {
  if (typeof window === 'undefined' || !user) return undefined
  return answers.get(keyOf(user, url)) as T | undefined
}

export function keepAnswer(user: string | null | undefined, url: string, data: unknown): void {
  if (typeof window === 'undefined' || !user) return
  const key = keyOf(user, url)
  answers.delete(key)
  answers.set(key, data)
  if (answers.size > MAX) answers.delete(answers.keys().next().value as string)
}

/** Forgets them all, for tests. */
export function forgetAnswers(): void {
  answers.clear()
}
