'use client'

import { motion } from 'framer-motion'
import type { RankRow } from '@/app/api/rankings/route'
import { useLanguage } from '@/context/LanguageContext'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'
import RankingsPageUser from '../rankings-page-user/RankingsPageUser'
import RankingsPageDelta from '../rankings-page-delta/RankingsPageDelta'
import RankingsPageStreak from '../rankings-page-streak/RankingsPageStreak'
import { ROW } from '../rankingsMotion'

/** The rankings on a phone: one row each, place, who with their level and streaks, and points. */
export default function RankingsPageList({
  rows,
  arrows,
  linked,
  approx = false,
  gapFrom,
}: {
  rows: RankRow[]
  arrows: boolean
  linked: boolean
  approx?: boolean
  /** The viewer's points (your zone): each other row says how far ahead or behind they are. */
  gapFrom?: number
}) {
  const { T, lang } = useLanguage()

  return (
    <ol className="flex flex-col gap-1.5">
      {rows.map((r, i) => (
        <motion.li
          key={r.username}
          variants={ROW}
          custom={i}
          initial="hidden"
          animate="show"
          className={`grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2.5 bg-bg-card rounded-xl px-3 py-2.5 ${r.isMe ? 'ring-[1.5px] ring-accent/60' : ''}`}
        >
          <span className={`text-center font-extrabold tabular-nums ${r.isMe ? 'text-accent' : 'text-text-secondary'}`}>
            <span className="sr-only">{T.rankings.colRank} </span>
            {r.rank}
          </span>
          <RankingsPageUser row={r} size="md" linked={linked}>
            <VaultLevelBadge points={r.totalPoints} className="self-start" />
            <RankingsPageStreak streak={r.streak} best={r.bestStreak} className="text-xs" />
            {gapFrom !== undefined && !r.isMe && (
              <span className="text-[11px] text-text-secondary">
                {(r.points >= gapFrom ? T.rankings.ahead : T.rankings.behind).replace('{n}', Math.abs(r.points - gapFrom).toLocaleString(lang))}
              </span>
            )}
          </RankingsPageUser>
          <span className="flex flex-col items-end gap-0.5">
            <span className="font-extrabold tabular-nums">
              {r.isMe && approx && <span className="text-warning" title={T.rankings.fillApprox}>≈ </span>}
              {r.points.toLocaleString(lang)} <span className="text-[10px] font-semibold text-text-secondary">{T.rankings.vp}</span>
            </span>
            {arrows && <RankingsPageDelta delta={r.delta} />}
          </span>
        </motion.li>
      ))}
    </ol>
  )
}
