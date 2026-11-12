'use client'

import { useMemo, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { Streak, UserAward } from '@/types/types'
import { useUserAwards } from '@/hooks/useUserAwards'
import { plural } from '@/utils/utils'
import StreakDayRow from '../streak-day-row/StreakDayRow'
import StreakCalendar from '../streak-calendar/StreakCalendar'
import SectionHead from '@/components/ui/SectionHead'
import { utcDay } from '@/utils/dates'

const COMPLETION_TYPES = new Set(['Mastery/Completion', 'Game Beaten'])

function awardDate(awardedAt: string): string {
  return utcDay(new Date(awardedAt))
}

/**
 * A streak day by day: a calendar of its days, shaded by how much was
 * unlocked, and beside it what was unlocked on the day picked (the last one to
 * begin with); stacked when the card is narrow. Rendered with the streak as
 * key, so picking another streak starts again from its last day.
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
      <SectionHead
        size="lg"
        id="streak-days-title"
        title={T.streak.listTitle}
        aside={`${plural(selectedStreak.days, T.plurals.days, lang)} · ${T.streak.calendarHint}`}
      />

      {/* Calendar and the picked day side by side when the card has room, stacked otherwise. */}
      <div className="@container">
        <div className="flex flex-col @3xl:flex-row gap-6 @3xl:gap-10">
          <StreakCalendar start={selectedStreak.start} end={selectedStreak.end} today={today} counts={counts} selected={shown} onSelect={setDay} />
          <StreakDayRow date={shown} today={today} achievements={byDate[shown] ?? []} awards={streakAwards[shown]} />
        </div>
      </div>
    </section>
  )
}
