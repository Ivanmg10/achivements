'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { Streak, UserAward } from '@/types/types'
import { useUserAwards } from '@/hooks/useUserAwards'
import StreakDayRow from '../streak-day-row/StreakDayRow'

interface Props {
  selectedStreak: Streak | null
}

const COMPLETION_TYPES = new Set(['Mastery/Completion', 'Game Beaten'])

function awardDate(awardedAt: string): string {
  return new Date(awardedAt).toISOString().split('T')[0]
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('default', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function StreakList({ selectedStreak }: Props) {
  const { T } = useLanguage()
  const { awards } = useUserAwards()

  const streakAwards = useMemo((): Record<string, UserAward[]> => {
    if (!selectedStreak || !awards?.VisibleUserAwards) return {}
    const { start, end } = selectedStreak
    const relevant = awards.VisibleUserAwards.filter(a => {
      if (!COMPLETION_TYPES.has(a.AwardType)) return false
      const d = awardDate(a.AwardedAt)
      return d >= start && d <= end
    })
    return relevant.reduce<Record<string, UserAward[]>>((acc, a) => {
      const d = awardDate(a.AwardedAt)
      if (!acc[d]) acc[d] = []
      acc[d].push(a)
      return acc
    }, {})
  }, [selectedStreak, awards])

  if (!selectedStreak) {
    return (
      <div className="bg-bg-card rounded-2xl p-6 flex items-center justify-center min-h-[160px]">
        <p className="text-text-secondary text-sm">{T.streak.noData}</p>
      </div>
    )
  }

  const byDate = selectedStreak.achievements.reduce<Record<string, typeof selectedStreak.achievements[0][]>>(
    (acc, a) => {
      const d = a.Date.split(' ')[0]
      if (!acc[d]) acc[d] = []
      acc[d].push(a)
      return acc
    },
    {}
  )

  // Merge all days (achievements + award-only days)
  const allDays = [...new Set([...Object.keys(byDate), ...Object.keys(streakAwards)])].sort(
    (a, b) => b.localeCompare(a)
  )

  return (
    <div className="bg-bg-card rounded-2xl p-5 flex flex-col gap-6">
      <div className="flex items-baseline gap-2 flex-wrap">
        <h2 className="text-sm uppercase tracking-widest text-text-secondary">{T.streak.listTitle}</h2>
        <span className="text-xs text-text-secondary">
          {formatDateShort(selectedStreak.start)} – {formatDateShort(selectedStreak.end)}
          {' · '}
          {selectedStreak.days} {T.streak.days}
        </span>
      </div>

      <div className="flex flex-col">
        {allDays.map(date => (
          <div key={date} className="pt-6 pb-6 border-b border-white/5 last:border-none last:pb-0 first:pt-0">
            <StreakDayRow
              date={date}
              achievements={byDate[date] ?? []}
              awards={streakAwards[date]}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
