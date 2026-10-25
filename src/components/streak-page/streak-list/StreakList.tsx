'use client'

import { useMemo, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { Streak, UserAward } from '@/types/types'
import { useUserAwards } from '@/hooks/useUserAwards'
import { plural } from '@/utils/utils'
import StreakDayRow from '../streak-day-row/StreakDayRow'
import StreakDayStrip from '../streak-day-strip/StreakDayStrip'
import StreakSectionHead from '../streak-section-head/StreakSectionHead'

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
export default function StreakList({ selectedStreak, today }: { selectedStreak: Streak | null; today: string }) {
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
    <section aria-labelledby="streak-days-title" className="flex-1 bg-bg-card rounded-card ring-1 ring-inset ring-ink/[0.06] p-5 sm:p-[1.375rem] flex flex-col gap-4">
      <StreakSectionHead
        id="streak-days-title"
        title={T.streak.listTitle}
        aside={`${plural(selectedStreak.days, T.plurals.days, lang)} · ${T.streak.calendarHint}`}
      />

      {/* The strip on top, how it is drawn under it, the picked day's unlocks last. */}
      <div className="flex flex-col gap-2">
        <StreakDayStrip start={selectedStreak.start} end={selectedStreak.end} today={today} counts={counts} selected={shown} onSelect={setDay} />
        <p className="text-xs text-text-secondary">{T.streak.stripHint}</p>
      </div>
      <StreakDayRow date={shown} today={today} achievements={byDate[shown] ?? []} awards={streakAwards[shown]} />
    </section>
  )
}
