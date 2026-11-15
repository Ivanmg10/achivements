import { after } from 'next/server'

/**
 * Work that must not hold the answer up: after the response inside a request (`after`), at once outside one
 * (a cron, a script, a test). A failure is logged, never thrown at the caller.
 */
export function runLater(task: () => Promise<unknown>): void {
  const run = () => task().catch((err: unknown) => console.error('[runLater]', err))
  try {
    after(run)
  } catch {
    void run()
  }
}
