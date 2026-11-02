/**
 * Whether something done on every page load may run now: true (and noted) when it
 * last ran in this tab more than `ms` ago, false when it ran since. Kept in
 * sessionStorage, so a reload in the same tab counts and another tab does not
 * (#101). Storage blocked: always true, as before this existed.
 */
export function dueInThisTab(key: string, ms: number, now = Date.now()): boolean {
  try {
    const last = Number(window.sessionStorage.getItem(key))
    if (Number.isFinite(last) && last > 0 && now - last < ms) return false
    window.sessionStorage.setItem(key, String(now))
  } catch {
    // Private mode or blocked storage: run it, as every load did.
  }
  return true
}
