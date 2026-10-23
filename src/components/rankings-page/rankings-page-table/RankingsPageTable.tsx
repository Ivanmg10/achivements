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

const TH = 'px-3 py-2.5 text-[10.5px] uppercase tracking-wider font-bold text-text-secondary text-left'

/**
 * The rankings as a table (from md up): place, who, level, points, where they
 * come from, their streaks (now and longest), their last weeks, games at 100 %, achievements and, on the view
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
    <div className="bg-bg-card rounded-2xl overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-ink/[0.07]">
            <th scope="col" className={`${TH} w-14`}>{T.rankings.colRank}</th>
            <th scope="col" className={TH}>{T.rankings.colUser}</th>
            <th scope="col" className={TH}>{T.rankings.colLevel}</th>
            <th scope="col" className={`${TH} text-right`}>{T.rankings.colPoints}</th>
            <th scope="col" className={TH}>{T.rankings.colStreak}</th>
            <th scope="col" className={`${TH} hidden lg:table-cell`}>{T.rankings.colPlatforms}</th>
            <th scope="col" className={`${TH} hidden lg:table-cell`}>{T.rankings.colTrend}</th>
            <th scope="col" className={`${TH} text-right hidden xl:table-cell`}>{T.rankings.colCompleted}</th>
            <th scope="col" className={`${TH} text-right hidden xl:table-cell`}>{T.rankings.colAchievements}</th>
            {arrows && <th scope="col" className={`${TH} text-right`}>{T.rankings.colChange}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <motion.tr key={r.username} variants={ROW} custom={i} initial="hidden" animate="show" className={`border-b border-ink/[0.05] last:border-0 ${r.isMe ? 'bg-accent/10' : ''}`}>
              <td className={`px-3 py-2.5 font-extrabold tabular-nums ${r.isMe ? 'text-accent' : 'text-text-secondary'}`}>{r.rank}</td>
              <td className="px-3 py-2 max-w-0 w-[34%]">
                <RankingsPageUser row={r} linked={linked}>
                  {gapFrom !== undefined && !r.isMe && (
                    <span className="text-[11px] text-text-secondary">
                      {(r.points >= gapFrom ? T.rankings.ahead : T.rankings.behind).replace('{n}', Math.abs(r.points - gapFrom).toLocaleString(lang))}
                    </span>
                  )}
                </RankingsPageUser>
              </td>
              <td className="px-3 py-2">
                <VaultLevelBadge points={r.totalPoints} />
              </td>
              <td className="px-3 py-2 text-right font-bold tabular-nums whitespace-nowrap">
                {r.isMe && approx && <span className="text-warning" title={T.rankings.fillApprox}>≈ </span>}
                {r.points.toLocaleString(lang)}
              </td>
              <td className="px-3 py-2">
                <RankingsPageStreak streak={r.streak} best={r.bestStreak} />
              </td>
              <td className="px-3 py-2 hidden lg:table-cell">
                <VaultPlatformSplit split={r.split} className="w-28" />
              </td>
              <td className="px-3 py-1.5 hidden lg:table-cell">
                <VaultSparkline weeks={r.trend} />
              </td>
              <td className="px-3 py-2 text-right tabular-nums hidden xl:table-cell">{r.completed.toLocaleString(lang)}</td>
              <td className="px-3 py-2 text-right tabular-nums hidden xl:table-cell">{r.achievements.toLocaleString(lang)}</td>
              {arrows && (
                <td className="px-3 py-2 text-right">
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
