'use client'

import { useMemo, type ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import { CircularProgress } from '@/components/ui/CircularProgress'
import { GameAchievementsProgressChart } from '@/components/game-achievements-progress-chart/GameAchievementsProgressChart'
import {
  beatenProgress, finishedAt, missablesLeft, nextTargets, paceEstimate, rarestEarned, type InsightAchievement,
} from '@/utils/gameInsights'
import { unlockSpan } from '@/utils/utils'
import LibraryDetailList from './library-detail-list/LibraryDetailList'
import LibraryDetailDifficulty from './library-detail-difficulty/LibraryDetailDifficulty'
import LibraryDetailFacts, { type DetailFact } from './library-detail-facts/LibraryDetailFacts'

export type LibraryCategory = 'wantToPlay' | 'playing' | 'completed'

const SKELETON_BADGES = 24
const PANEL = 'bg-bg-header/40 rounded-xl p-3'

/** The panels come in one after another, each rising a little as it fades in. */
const CONTAINER: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } } }
const PANEL_IN: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
}

/**
 * What an opened card in a status list shows, for any platform: the progress
 * ring, two panels that depend on where the game stands, a row of figures and
 * the full grid of achievements.
 *
 * - **playing** — the chart of unlocks over time, and the next ones to go for.
 * - **completed** — the same chart, and the rarest earned: a trophy room.
 * - **wantToPlay** — how hard the game is, and the easiest to start with.
 *
 * The platform brings its own ring, figures and grid (it knows its trophies
 * and playtime); this brings the layout and everything computed from the
 * achievements, so the three cards cannot drift apart.
 */
export default function LibraryGameDetail({
  category,
  items,
  state,
  errorNode,
  ring,
  ringExtra,
  facts = [],
  grid,
  empty,
}: {
  category: LibraryCategory
  items: InsightAchievement[]
  state: 'loading' | 'error' | 'ready'
  /** Shown instead of the panels when the achievements could not be loaded. */
  errorNode?: ReactNode
  ring: { earned: number; total: number; label: string }
  /** Under the ring, e.g. PSN's trophies by grade. */
  ringExtra?: ReactNode
  /** The platform's own figures, shown before the computed ones. */
  facts?: DetailFact[]
  grid: ReactNode
  /** Said in place of the grid when the game has no achievements. */
  empty: string
}) {
  const { T, lang } = useLanguage()
  const L = T.libraryDetail
  const loading = state === 'loading'
  const reduce = useReducedMotion()

  const unlocks = useMemo(() => items.map((a) => ({ DateEarned: a.earnedAt, DateEarnedHardcore: null })), [items])

  const computed = useMemo<DetailFact[]>(() => {
    const out: DetailFact[] = []
    const left = items.filter((a) => !a.earned).length
    if (category !== 'completed' && items.length > 0) out.push({ label: T.gameExpanded.remaining, value: String(left), className: 'text-info' })

    const withPoints = items.filter((a) => a.points !== null)
    if (withPoints.length > 0) {
      const total = withPoints.reduce((sum, a) => sum + a.points!, 0)
      const earned = withPoints.filter((a) => a.earned).reduce((sum, a) => sum + a.points!, 0)
      out.push({ label: T.gameExpanded.points, value: category === 'wantToPlay' ? String(total) : `${earned} / ${total}`, className: 'text-warning' })
    }

    if (category === 'playing') {
      const beaten = beatenProgress(items)
      if (beaten) out.push({ label: L.beaten, value: `${beaten.done} / ${beaten.total}` })
      const missed = missablesLeft(items)
      if (missed > 0) out.push({ label: L.missable, value: String(missed), className: 'text-warning' })
      const pace = paceEstimate(items)
      if (pace) {
        out.push({ label: L.pace, value: L.perWeek.replace('{n}', pace.perWeek >= 10 ? String(Math.round(pace.perWeek)) : pace.perWeek.toFixed(1)) })
        if (pace.weeksLeft !== null) {
          out.push({ label: L.atThisPace, value: (pace.weeksLeft === 1 ? L.weekLeft : L.weeksLeft).replace('{n}', String(pace.weeksLeft)) })
        }
      }
    }

    if (category === 'completed') {
      const done = finishedAt(items)
      if (done) out.push({ label: L.finished, value: new Date(done).toLocaleDateString(lang), className: 'text-success' })
      const span = unlockSpan(items.map((a) => a.earnedAt), {
        underMinute: T.statusGameItem.spanUnderMinute,
        minutes: T.statusGameItem.spanMinutes,
        hours: T.statusGameItem.spanHours,
        days: T.statusGameItem.spanDays,
        months: T.statusGameItem.spanMonths,
      })
      if (span) out.push({ label: L.timeSpan, value: span })
    }
    return out
  }, [items, category, T, L, lang])

  const allFacts = loading || state === 'error' ? facts : [...facts, ...computed]

  const side =
    category === 'playing' ? (
      <LibraryDetailList title={L.nextTargets} items={nextTargets(items)} empty={L.noTargets} isLoading={loading} />
    ) : category === 'completed' ? (
      <LibraryDetailList title={L.rarestEarned} items={rarestEarned(items)} empty={L.noneEarned} isLoading={loading} />
    ) : (
      <LibraryDetailList title={L.startWith} items={nextTargets(items)} empty={L.noTargets} isLoading={loading} />
    )

  return (
    <motion.div
      variants={CONTAINER}
      initial={reduce ? false : 'hidden'}
      animate="show"
      className="grid grid-cols-1 lg:grid-cols-[190px_1.3fr_1fr] lg:grid-rows-[20rem] gap-3 w-full"
    >
      <motion.div variants={PANEL_IN} className={`${PANEL} p-4 lg:p-6 flex flex-col items-center justify-center gap-3`}>
        <CircularProgress earned={ring.earned} total={ring.total} label={ring.label} size={130} />
        {ringExtra}
      </motion.div>

      {state === 'error' ? (
        <motion.div variants={PANEL_IN} className={`${PANEL} lg:col-span-2`}>{errorNode}</motion.div>
      ) : (
        <>
          <motion.div variants={PANEL_IN} className={PANEL}>
            {category === 'wantToPlay' ? (
              <LibraryDetailDifficulty items={items} isLoading={loading} />
            ) : (
              <GameAchievementsProgressChart achievements={unlocks} isLoading={loading} />
            )}
          </motion.div>
          <motion.div variants={PANEL_IN} className={PANEL}>{side}</motion.div>
        </>
      )}

      {allFacts.length > 0 && (
        <motion.div variants={PANEL_IN} className="lg:col-span-3">
          <LibraryDetailFacts facts={allFacts} />
        </motion.div>
      )}

      {state !== 'error' && (
        <motion.div variants={PANEL_IN} className={`${PANEL} lg:col-span-3`}>
          <p className="text-xs text-text-secondary mb-2">{ring.label}</p>
          {loading ? (
            <ul aria-busy="true" className="flex flex-wrap gap-1">
              {Array.from({ length: Math.min(ring.total || SKELETON_BADGES, 60) }).map((_, i) => (
                <li key={i} className="w-10 h-10 rounded-lg bg-ink/10 animate-pulse" />
              ))}
            </ul>
          ) : items.length === 0 ? (
            <p className="text-center text-text-secondary text-sm py-2">{empty}</p>
          ) : (
            grid
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
