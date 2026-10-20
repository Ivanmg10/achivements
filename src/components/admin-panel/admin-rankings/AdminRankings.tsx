'use client'

import { IconScale } from '@tabler/icons-react'
import { useAdminRankings } from '@/hooks/useAdminRankings'
import { notify } from '@/lib/notify'
import type { FlaggedGame } from '@/app/api/admin/rankings/route'

const NAMES: Record<string, string> = { ra: 'RetroAchievements', steam: 'Steam', psn: 'PlayStation', xbox: 'Xbox' }
const num = (x: number | null) => (x === null ? '—' : x.toLocaleString('en'))

/**
 * The rankings, for admins (English, like the rest of the panel). The balance:
 * median points per achievement, per finished game and per user on each
 * platform, which should stay within about 10 % of each other
 * (docs/rankings-plan.md). And the Steam games flagged for an unlock tool,
 * kept out of the rankings until reviewed here.
 */
export default function AdminRankings() {
  const { balance, flagged, loadError, retry, review, busy } = useAdminRankings()

  async function handleReview(game: FlaggedGame, flag: 'cleared' | 'suspect') {
    if (await review(game, flag)) notify.success(flag === 'cleared' ? 'The game counts in the rankings' : 'The game is kept out of the rankings')
    else notify.error('Could not save the review. Try again.')
  }

  return (
    <section aria-labelledby="admin-rankings-title" className="bg-bg-card rounded-2xl p-4 flex flex-col gap-3">
      <h3 id="admin-rankings-title" className="flex items-center gap-2 text-sm font-semibold">
        <IconScale size={16} className="text-accent" aria-hidden="true" />
        Rankings balance
      </h3>

      {loadError ? (
        <p role="alert" className="text-sm text-red-400">
          Could not load the rankings.{' '}
          <button onClick={retry} className="underline hover:text-red-300">
            Retry
          </button>
        </p>
      ) : !balance ? (
        <div aria-busy="true" className="h-16 rounded bg-ink/10 animate-pulse" />
      ) : balance.length === 0 ? (
        <p className="text-sm text-text-secondary">No scores yet: they appear as users visit and the daily cron runs.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <caption className="sr-only">Median Vault Points per platform</caption>
            <thead className="text-text-secondary">
              <tr>
                {['Platform', 'Users', 'Games', 'At 100%', 'Per achievement', 'Per finished game', 'Per user'].map((h) => (
                  <th key={h} scope="col" className="text-left font-semibold px-2 py-1.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {balance.map((b) => (
                <tr key={b.source} className="border-t border-ink/5 tabular-nums">
                  <th scope="row" className="text-left font-medium px-2 py-1.5">{NAMES[b.source] ?? b.source}</th>
                  <td className="px-2 py-1.5">{num(b.users)}</td>
                  <td className="px-2 py-1.5">{num(b.games)}</td>
                  <td className="px-2 py-1.5">{num(b.completed)}</td>
                  <td className="px-2 py-1.5">{num(b.perAchievement)}</td>
                  <td className="px-2 py-1.5">{num(b.perCompleted)}</td>
                  <td className="px-2 py-1.5">{num(b.perUser)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {flagged.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold text-text-secondary">Flagged for an unlock tool (most achievements on one second)</h4>
          <ul className="flex flex-col gap-1.5">
            {flagged.map((g) => {
              const key = `${g.userId}:${g.source}:${g.gameId}`
              return (
                <li key={key} className="flex flex-wrap items-center justify-between gap-2 bg-bg-main rounded-xl px-3 py-2 text-xs">
                  <span className="min-w-0">
                    <strong>{g.username}</strong> · {g.title} <span className="text-text-secondary">({g.earned}/{g.total}, {num(g.points)} VP)</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={g.flag === 'suspect' ? 'text-warning' : 'text-success'}>{g.flag === 'suspect' ? 'Kept out' : 'Counts'}</span>
                    <button
                      disabled={busy === key}
                      onClick={() => handleReview(g, g.flag === 'suspect' ? 'cleared' : 'suspect')}
                      className="px-2.5 py-1 rounded-lg bg-bg-card hover:bg-ink/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                    >
                      {g.flag === 'suspect' ? 'Let it count' : 'Keep it out'}
                    </button>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
