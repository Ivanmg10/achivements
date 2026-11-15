import { tidyPsnPool } from '@/lib/psnAccounts'
import { runPsnCanaries } from '@/lib/psnAccountCheck'
import { sendPsnAlerts } from '@/lib/psnAlerts'
import { runLater } from '@/lib/runLater'
import { takeLease } from '@/lib/steamCache'

/**
 * The PSN pool's upkeep (#178): a draining account with nothing in flight is paused, the canaries that are due
 * run (which also refreshes each account's tokens ahead of time, two accounts at a time), and the alerts go out.
 *
 * Run by `/api/cron/psn-alerts`, and after PSN traffic at most once per 15 minutes for the whole app (a lease):
 * Vercel's daily crons alone would leave the canary a day old.
 */
const EVERY_MS = 15 * 60_000
/** How often one instance even asks for the lease. */
const LOCAL_EVERY_MS = 5 * 60_000
const LEASE_KEY = 'psn:maintenance'

let nextLocal = 0

export async function runPsnMaintenance(): Promise<{ canaries: number; alerts: Awaited<ReturnType<typeof sendPsnAlerts>> }> {
  await tidyPsnPool()
  const canaries = await runPsnCanaries()
  const alerts = await sendPsnAlerts()
  return { canaries, alerts }
}

/** Called on every PSN call; cheap. Starts the upkeep after the answer when it is due. */
export function maybeMaintainPsnPool(now = Date.now()): void {
  if (now < nextLocal) return
  nextLocal = now + LOCAL_EVERY_MS
  runLater(async () => {
    if (await takeLease(LEASE_KEY, EVERY_MS)) await runPsnMaintenance()
  })
}
