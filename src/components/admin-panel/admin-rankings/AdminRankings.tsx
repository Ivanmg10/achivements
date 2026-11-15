'use client'

import { IconScale } from '@tabler/icons-react'
import { useAdminRankings } from '@/hooks/useAdminRankings'
import { notify } from '@/lib/notify'
import type { FlaggedGame } from '@/app/api/admin/rankings/route'
import { Skeleton } from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import ErrorRetry from '@/components/ui/ErrorRetry'
import { NUM, ROW, TABLE, TD, TD_FIRST, TH } from '@/components/ui/dataTable'
import { PLATFORM_NAME } from '@/utils/gameRef'
import type { GameSource } from '@/types/game'

const COLUMNS = ['Platform', 'Users', 'Games', 'At 100%', 'Per achievement', 'Per finished game', 'Per user']
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
    <section aria-labelledby="admin-rankings-title" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 id="admin-rankings-title" className="flex items-center gap-2 text-sm font-semibold">
          <IconScale size={16} className="text-accent" aria-hidden="true" />
          Rankings balance
        </h3>

        {loadError ? (
          <ErrorRetry message="Could not load the rankings." retryLabel="Retry" onRetry={retry} />
        ) : !balance ? (
          <div role="status" aria-busy="true" className="flex flex-col gap-2">
            <span className="sr-only">Loading…</span>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} radius="tile" className="h-10" />
            ))}
          </div>
        ) : balance.length === 0 ? (
          <p className="text-sm text-text-secondary">No scores yet: they appear as users visit and the daily cron runs.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className={TABLE}>
              <caption className="sr-only">Median Vault Points per platform</caption>
              <thead>
                <tr>
                  {COLUMNS.map((h, i) => (
                    <th key={h} scope="col" className={`${TH} ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {balance.map((b) => (
                  <tr key={b.source} className={ROW}>
                    <th scope="row" className={`${TD_FIRST} text-left font-medium`}>{PLATFORM_NAME[b.source as GameSource] ?? b.source}</th>
                    {[b.users, b.games, b.completed, b.perAchievement, b.perCompleted, b.perUser].map((v, i) => (
                      <td key={i} className={`${TD} ${NUM}`}>{num(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {flagged.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold">Flagged for an unlock tool (most achievements on one second)</h4>
          <div className="overflow-x-auto">
            <table className={TABLE}>
              <caption className="sr-only">Games flagged for an unlock tool</caption>
              <thead>
                <tr>
                  <th scope="col" className={`${TH} text-left`}>User</th>
                  <th scope="col" className={`${TH} text-left`}>Game</th>
                  <th scope="col" className={`${TH} text-right`}>Earned</th>
                  <th scope="col" className={`${TH} text-right`}>Vault Points</th>
                  <th scope="col" className={`${TH} text-left`}>Status</th>
                  <th scope="col" className={TH}><span className="sr-only">Review</span></th>
                </tr>
              </thead>
              <tbody>
                {flagged.map((g) => {
                  const key = `${g.userId}:${g.source}:${g.gameId}`
                  return (
                    <tr key={key} className={ROW}>
                      <td className={`${TD_FIRST} font-semibold`}>{g.username}</td>
                      <td className={TD}>{g.title}</td>
                      <td className={`${TD} ${NUM}`}>{g.earned}/{g.total}</td>
                      <td className={`${TD} ${NUM}`}>{num(g.points)}</td>
                      <td className={`${TD} ${g.flag === 'suspect' ? 'text-warning' : 'text-success'}`}>{g.flag === 'suspect' ? 'Kept out' : 'Counts'}</td>
                      <td className={`${TD} text-right`}>
                        <Button variant="secondary" size="sm" disabled={busy === key} onClick={() => handleReview(g, g.flag === 'suspect' ? 'cleared' : 'suspect')}>
                          {g.flag === 'suspect' ? 'Let it count' : 'Keep it out'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
