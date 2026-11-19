import type { PsnAccountInfo, PsnMetrics, PsnPoolStatus } from '@/types/psnPool'
import { daysUntil } from '@/utils/psnPool'
import Figure, { FIGURES_BY_THREE } from '@/components/ui/Figure'
import { NUM, ROW, TABLE, TD, TD_FIRST, TH } from '@/components/ui/dataTable'

/** Admin panel text is English (exempt from i18n). */
const ms = (n: number | null) => (n === null ? 'n/a' : `${n.toLocaleString('en')} ms`)
const minutes = (n: number | null) => (n === null ? 'n/a' : n < 60_000 ? `${Math.round(n / 1000)} s` : `${Math.round(n / 60_000)} min`)
const byFn = (fns: Record<string, number>) =>
  Object.entries(fns)
    .sort((a, b) => b[1] - a[1])
    .map(([fn, n]) => `${fn} ${n}`)
    .join(', ') || 'none'

/**
 * The PSN pool's numbers (#180): the pool as a whole (how long a call to Sony and a page read take, the share of
 * reads the store answered at once, the queue's depth and lag, 429s in the last 5 minutes), then each account's
 * last hour (calls a minute and by function, 429 %, sign-ins refused, hidden profiles, p95, days left).
 */
export default function AdminPsnPoolMetrics({
  metrics: m,
  accounts,
  switches,
  now,
}: {
  metrics: PsnMetrics
  accounts: PsnAccountInfo[]
  switches?: PsnPoolStatus['switches']
  now: number
}) {
  const label = (id: number) => accounts.find((a) => a.id === id)?.label ?? `#${id}`
  const days = (id: number) => daysUntil(accounts.find((a) => a.id === id)?.npssoExpiresAt ?? null, now)
  return (
    <section aria-labelledby="admin-psn-metrics" className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2 flex-wrap">
        <h4 id="admin-psn-metrics" className="text-sm font-semibold">Numbers</h4>
        {switches && (
          <span className="text-xs text-text-secondary">
            {`PSN_MODE ${switches.mode}, pool ${switches.poolEnabled ? 'on' : 'off (one account)'}. Changed in Vercel; the runbook is in docs/platforms/psn.md.`}
          </span>
        )}
      </div>
      <div className={FIGURES_BY_THREE}>
        <Figure label="Sony call p95, last hour" value={ms(m.sonyP95Ms)} />
        <Figure label="Page read p95, 15 min" value={ms(m.readP95Ms)} sub={`${m.reads15m} reads`} />
        <Figure label="Reads served at once" value={m.readsServedPct === null ? 'n/a' : `${m.readsServedPct} %`} />
        <Figure label="Queue due now" value={m.queue.due} sub={`${m.queue.queued} queued, ${m.queue.running} running`} />
        <Figure label="Queue lag p95" value={minutes(m.queue.lagP95Ms)} tone={m.queue.lagP95Ms !== null && m.queue.lagP95Ms > 15 * 60_000 ? 'warning' : 'main'} />
        <Figure label="429s, last 5 min" value={`${m.rateLimited5m} of ${m.calls5m}`} tone={m.calls5m > 0 && m.rateLimited5m / m.calls5m > 0.01 ? 'warning' : 'main'} />
      </div>
      {m.accounts.length > 0 && (
        <div className="overflow-x-auto">
          <table className={TABLE}>
            <thead>
              <tr>
                <th scope="col" className={`${TH} text-left`}>Account</th>
                <th scope="col" className={`${TH} text-right`}>Calls/min</th>
                <th scope="col" className={`${TH} text-left`}>By function</th>
                <th scope="col" className={`${TH} text-right`}>429 %</th>
                <th scope="col" className={`${TH} text-right`}>401</th>
                <th scope="col" className={`${TH} text-right`}>403</th>
                <th scope="col" className={`${TH} text-right`}>p95</th>
                <th scope="col" className={`${TH} text-right`}>Days left</th>
              </tr>
            </thead>
            <tbody>
              {m.accounts.map((a) => (
                <tr key={a.accountId} className={ROW}>
                  <th scope="row" className={`${TD_FIRST} text-left font-semibold`}>{label(a.accountId)}</th>
                  <td className={`${TD} ${NUM}`}>{a.callsPerMin}</td>
                  <td className={`${TD} text-text-secondary`}>{byFn(a.byFn)}</td>
                  <td className={`${TD} ${NUM}`}>{a.rateLimitedPct}</td>
                  <td className={`${TD} ${NUM}`}>{a.authErrors}</td>
                  <td className={`${TD} ${NUM}`}>{a.forbidden}</td>
                  <td className={`${TD} ${NUM}`}>{ms(a.p95Ms)}</td>
                  <td className={`${TD} ${NUM}`}>{days(a.accountId) ?? 'n/a'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
