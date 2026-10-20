'use client'

import type { RankRow } from '@/app/api/rankings/route'
import { useLanguage } from '@/context/LanguageContext'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'
import RankingsPageUser from '../rankings-page-user/RankingsPageUser'

/** Second, first and third, as a podium stands: how tall each step is and how much the first glows. */
const STEP: Record<number, string> = { 1: 'h-16 sm:h-20', 2: 'h-11 sm:h-14', 3: 'h-8 sm:h-10' }
const GLOW: Record<number, string> = {
  1: 'bg-[radial-gradient(ellipse_at_top,rgb(var(--accent)/0.28),transparent_70%)]',
  2: 'bg-[radial-gradient(ellipse_at_top,rgb(var(--accent)/0.16),transparent_70%)]',
  3: 'bg-[radial-gradient(ellipse_at_top,rgb(var(--accent)/0.1),transparent_70%)]',
}

/** The first three, on a podium: picture, name, level and points, with the place on each step. */
export default function RankingsPagePodium({ rows, linked, approx = false }: { rows: RankRow[]; linked: boolean; approx?: boolean }) {
  const { T, lang } = useLanguage()
  const order = [rows[1], rows[0], rows[2]].filter(Boolean)

  return (
    <ol aria-label={T.rankings.title} className="grid grid-cols-3 gap-2 sm:gap-3 items-end">
      {order.map((r) => (
        <li
          key={r.username}
          className={`relative bg-bg-card rounded-2xl sm:rounded-3xl pt-4 sm:pt-5 px-2 sm:px-4 flex flex-col items-center gap-2 overflow-hidden ${r.isMe ? 'ring-2 ring-accent/50' : ''}`}
        >
          <span aria-hidden="true" className={`absolute inset-0 pointer-events-none ${GLOW[r.rank] ?? GLOW[3]}`} />
          <span className="relative flex flex-col items-center gap-1.5 min-w-0 w-full">
            <RankingsPageUser row={r} size={r.rank === 1 ? 'xl' : 'lg'} linked={linked} stacked>
              <VaultLevelBadge points={r.totalPoints} compact className="sm:hidden" />
              <VaultLevelBadge points={r.totalPoints} className="hidden sm:inline-flex" />
            </RankingsPageUser>
            <span className="text-lg sm:text-2xl font-extrabold tracking-tight tabular-nums">
              {r.isMe && approx && <span className="text-warning" title={T.rankings.fillApprox}>≈ </span>}
              {r.points.toLocaleString(lang)} <span className="text-[11px] font-semibold text-text-secondary">{T.rankings.vp}</span>
            </span>
          </span>
          <span
            className={`relative w-full ${STEP[r.rank] ?? STEP[3]} rounded-t-xl bg-linear-to-b from-accent/30 to-accent/5 flex items-start justify-center pt-1.5 text-sm sm:text-base font-extrabold text-accent tabular-nums`}
          >
            <span className="sr-only">{T.rankings.colRank}</span>
            {r.rank}
          </span>
        </li>
      ))}
    </ol>
  )
}
