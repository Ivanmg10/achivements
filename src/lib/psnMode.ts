/**
 * The PSN switches for a bad day (#180), read from the environment on every call so a change in Vercel applies on
 * the next deploy without code:
 *
 * - `PSN_MODE=live` (default): everything runs.
 * - `PSN_MODE=queue`: only the core is read (the trophy counts and the list); play data, the year and the history
 *   wait in the queue until the mode is back to live. For when Sony is slow or the budget is tight.
 * - `PSN_MODE=stale`: Sony is never called. Pages serve what is stored, the queue waits, linking and verifying
 *   answer 503 `paused`. For when Sony is down or every account is refused.
 * - `PSN_POOL_ENABLED=false`: one account (the oldest active one) does all the reading, no failover. For when the
 *   pool itself misbehaves; true by default.
 *
 * The runbook in docs/platforms/psn.md says when to use which.
 */
export type PsnMode = 'live' | 'queue' | 'stale'

type Env = Record<string, string | undefined>

export function psnMode(env: Env = process.env): PsnMode {
  const mode = env.PSN_MODE?.trim().toLowerCase()
  return mode === 'queue' || mode === 'stale' ? mode : 'live'
}

export function psnPoolEnabled(env: Env = process.env): boolean {
  return env.PSN_POOL_ENABLED?.trim().toLowerCase() !== 'false'
}
