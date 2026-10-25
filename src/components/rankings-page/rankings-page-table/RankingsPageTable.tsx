'use client'

import { motion } from 'framer-motion'
import type { RankRow } from '@/app/api/rankings/route'
import { useLanguage } from '@/context/LanguageContext'
import VaultLevelBadge from '@/components/vault-level-badge/VaultLevelBadge'
import VaultPlatformSplit from '@/components/vault-platform-split/VaultPlatformSplit'
import VaultSparkline from '@/components/vault-sparkline/VaultSparkline'
import RankingsPageUser from '../rankings-page-user/RankingsPageUser'
import RankingsPageDelta from '../rankings-page-delta/RankingsPageDelta'
import RankingsPageStreak from '../rankings-page-streak/RankingsPageStreak'
import { ROW } from '../rankingsMotion'

const TH = 'px-3 py-2.5 text-[0.6875rem] uppercase tracking-[0.08em] font-bold text-text-secondary text-left shadow-[inset_0_-1px_0_rgb(var(--ink)/0.1)] whitespace-nowrap'
const TD = 'px-3 py-3 shadow-[inset_0_-1px_0_rgb(var(--ink)/0.05)] align-middle'

/**
 * The rankings as a table (from md up): place, who with their level, then their
 * points (how many, where they come from, their last weeks), then how they play
 * (their streaks now and longest, games at 100 %, achievements) and, on the view
 * that has them, the places moved this week. Your row is tinted and says "You".
 * Given `gapFrom` (your zone), each other name says how far ahead or behind you they are.
 */
export default function RankingsPageTable({
  rows,
  arrows,
  linked,
  caption,
  approx = false,
  gapFrom,
}: {
  rows: RankRow[]
  arrows: boolean
  linked: boolean
  caption: string
  /** The viewer's own points are still being calculated: theirs carry "≈". */
  approx?: boolean
  /** The viewer's points, to say under each other name how far ahead or behind they are. */
  gapFrom?: number
}) {
  const { T, lang } = useLanguage()

  return (
    <div className="bg-bg-card rounded-card ring-1 ring-inset ring-ink/[0.06] overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-0">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className={`${TH} w-12`}>{T.rankings.colRank}</th>
            <th scope="col" className={TH}>{T.rankings.colUser}</th>
            <th scope="col" className={`${TH} text-right`}>{T.rankings.colPoints}</th>
            <th scope="col" className={`${TH} text-center hidden lg:table-cell`}>{T.rankings.colTrend}</th>
            <th scope="col" className={`${TH} text-center`}>{T.rankings.colStreak}</th>
            <th scope="col" className={`${TH} text-right hidden xl:table-cell`}>{T.rankings.colCompleted}</th>
            <th scope="col" className={`${TH} text-right hidden xl:table-cell`}>{T.rankings.colAchievements}</th>
            {arrows && <th scope="col" className={`${TH} text-right`}>{T.rankings.colChange}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <motion.tr key={r.username} variants={ROW} custom={i} initial="hidden" animate="show" className={`group transition-colors hover:[&>td]:bg-accent/[0.06] ${r.isMe ? '[&>td]:bg-accent/10' : ''}`}>
              <td className={`${TD} relative font-display italic font-extrabold text-[1.625rem] leading-none tabular-nums ${r.isMe ? "text-accent before:content-[''] before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1 before:bg-accent before:skew-y-(--slant-mark)" : 'text-text-secondary'}`}>{r.rank}</td>
              <td className={`${TD} max-w-0 w-[30%]`}>
                <RankingsPageUser row={r} size="md" linked={linked} nameClass="text-[0.9375rem] font-extrabold">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <VaultLevelBadge points={r.totalPoints} compact />
                    {gapFrom !== undefined && !r.isMe && (
                      <span className="text-[11px] text-text-secondary">
                        {(r.points >= gapFrom ? T.rankings.ahead : T.rankings.behind).replace('{n}', Math.abs(r.points - gapFrom).toLocaleString(lang))}
                      </span>
                    )}
                  </span>
                </RankingsPageUser>
              </td>
              <td className={`${TD} text-right whitespace-nowrap`}>
                <span className="inline-flex flex-col items-end gap-1.5">
                  <span className="tabular-nums">
                    {r.isMe && approx && <span className="text-warning" title={T.rankings.fillApprox}>≈ </span>}
                    <strong className="text-lg font-extrabold">{r.points.toLocaleString(lang)}</strong> <span className="text-[0.6875rem] text-text-secondary">{T.rankings.vp}</span>
                  </span>
                  <VaultPlatformSplit split={r.split} className="w-[7.5rem]" />
                </span>
              </td>
              <td className={`${TD} hidden lg:table-cell`}>
                <span className="flex justify-center">
                  <VaultSparkline weeks={r.trend} />
                </span>
              </td>
              <td className={`${TD} text-center`}>
                <RankingsPageStreak streak={r.streak} best={r.bestStreak} />
              </td>
              <td className={`${TD} text-right font-bold tabular-nums hidden xl:table-cell`}>{r.completed.toLocaleString(lang)}</td>
              <td className={`${TD} text-right font-bold tabular-nums hidden xl:table-cell`}>{r.achievements.toLocaleString(lang)}</td>
              {arrows && (
                <td className={`${TD} text-right`}>
                  <RankingsPageDelta delta={r.delta} />
                </td>
              )}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
