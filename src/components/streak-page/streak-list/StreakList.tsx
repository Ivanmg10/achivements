'use client'

import { useMemo, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { Streak, UserAward } from '@/types/types'
import { useUserAwards } from '@/hooks/useUserAwards'
import { formatDay, plural } from '@/utils/utils'
import StreakDayRow from '../streak-day-row/StreakDayRow'
import StreakDayStrip from '../streak-day-strip/StreakDayStrip'

const COMPLETION_TYPES = new Set(['Mastery/Completion', 'Game Beaten'])

function awardDate(awardedAt: string): string {
  return new Date(awardedAt).toISOString().split('T')[0]
}

/**
 * A streak day by day: a strip of its days, as tall as how much was
 * unlocked, and what was unlocked on the day picked (the last one to begin
 * with). Rendered with the streak as key, so picking another streak starts
 * again from its last day.
 */
export default function StreakList({ selectedStreak }: { selectedStreak: Streak | null }) {
  const { T, lang } = useLanguage()
  const { awards } = useUserAwards()
  const [day, setDay] = useState<string | null>(null)

  const streakAwards = useMemo((): Record<string, UserAward[]> => {
    if (!selectedStreak || !awards?.VisibleUserAwards) return {}
    const { start, end } = selectedStreak
    return awards.VisibleUserAwards.filter((a) => {
      if (!COMPLETION_TYPES.has(a.AwardType)) return false
      const d = awardDate(a.AwardedAt)
      return d >= start && d <= end
    }).reduce<Record<string, UserAward[]>>((acc, a) => {
      const d = awardDate(a.AwardedAt)
      ;(acc[d] ??= []).push(a)
      return acc
    }, {})
  }, [selectedStreak, awards])

  const byDate = useMemo(
    () =>
      (selectedStreak?.achievements ?? []).reduce<Record<string, Streak['achievements']>>((acc, a) => {
        ;(acc[a.Date.split(' ')[0]] ??= []).push(a)
        return acc
      }, {}),
    [selectedStreak],
  )

  if (!selectedStreak) {
    return (
      <div className="bg-bg-card rounded-card p-6 flex items-center justify-center min-h-[160px]">
        <p className="text-text-secondary text-sm">{T.streak.noData}</p>
      </div>
    )
  }

  const counts = Object.fromEntries(Object.entries(byDate).map(([d, list]) => [d, list.length]))
  const shown = day ?? selectedStreak.end

  return (
    <section aria-labelledby="streak-days-title" className="flex-1 bg-bg-card rounded-card p-5 flex flex-col gap-5">
      <div className="flex items-baseline gap-2 flex-wrap">
        <h2 id="streak-days-title" className="text-sm uppercase tracking-widest text-text-secondary">
          {T.streak.listTitle}
        </h2>
        <span className="text-xs text-text-secondary">
          {formatDay(selectedStreak.start, lang, { day: 'numeric', month: 'short', year: 'numeric' })} –{' '}
          {formatDay(selectedStreak.end, lang, { day: 'numeric', month: 'short', year: 'numeric' })}
          {' · '}
          {plural(selectedStreak.days, T.plurals.days, lang)}
        </span>
      </div>

      {/* The strip on top, the picked day's unlocks under it. */}
      <div className="flex flex-col gap-2">
        <StreakDayStrip start={selectedStreak.start} end={selectedStreak.end} counts={counts} selected={shown} onSelect={setDay} />
        <p className="text-xs text-text-secondary">{T.streak.calendarHint}</p>
      </div>
      <div className="border-t border-ink/[0.06] pt-5 min-w-0">
        <StreakDayRow date={shown} achievements={byDate[shown] ?? []} awards={streakAwards[shown]} />
      </div>
    </section>
  )
}
