export type ConsoleOption = { name: string; count: number }

const SEPARATOR = ' · '

/** The consoles a game is on: PlayStation and Xbox join several into one label ("PS4 · PS5"). */
export function consolesOf(consoleName: string | null | undefined): string[] {
  return (consoleName ?? '')
    .split(SEPARATOR)
    .map((c) => c.trim())
    .filter(Boolean)
}

/** Every console in a list of games, with how many games are on it; the biggest first. `always` are listed even with none. */
export function consoleOptions(consoleNames: string[], always: readonly string[] = []): ConsoleOption[] {
  const counts = new Map<string, number>(always.map((name) => [name, 0]))
  for (const label of consoleNames) {
    for (const name of consolesOf(label)) counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

/**
 * A game is shown unless every console it is on was unticked: a backward-compatible
 * "Xbox 360 · Xbox Series" game stays while either of them is ticked.
 */
export function isConsoleShown(consoleName: string, hidden: ReadonlySet<string>): boolean {
  if (hidden.size === 0) return true
  const consoles = consolesOf(consoleName)
  return consoles.length === 0 || consoles.some((c) => !hidden.has(c))
}

/** The games on a ticked console; the same list when nothing is hidden. */
export function filterByConsole<T>(games: T[], consoleNameOf: (game: T) => string, hidden: ReadonlySet<string>): T[] {
  return hidden.size === 0 ? games : games.filter((g) => isConsoleShown(consoleNameOf(g), hidden))
}
