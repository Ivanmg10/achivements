'use client'

import { useMemo } from 'react'
import { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { useUserAwards } from '@/hooks/useUserAwards'
import DayAchievementsAwards from '@/components/day-achievements-awards/DayAchievementsAwards'
import PeriodAchievementsDay from '@/components/period-achievements-day/PeriodAchievementsDay'
import Modal from '@/components/ui/Modal'
import Facts from '@/components/ui/Facts'
import { formatWeekdayDay, utcDay } from '@/utils/dates'
import { groupDays } from '@/utils/periodDays'
import { plural } from '@/utils/utils'

interface Props {
  date: string
  achievements: RecentAchievement[]
  onClose: () => void
}

const COMPLETION_TYPES = new Set(['Mastery/Completion', 'Game Beaten'])

function awardDate(awardedAt: string): string {
  return utcDay(new Date(awardedAt))
}

/** One day's unlocks, grouped by game as in the week and month dialogs (the same pane), under the day's mastery awards. */
export default function DayAchievementsModal({ date, achievements, onClose }: Props) {
  const { T, lang } = useLanguage()
  const { awards } = useUserAwards()
  const day = useMemo(() => groupDays(achievements.filter(a => a.Date.startsWith(date)))[0], [achievements, date])

  const dayAwards = useMemo(() => {
    // Mastery/beaten awards are RA's; Steam unlocks in the list simply have none.
    if (!awards?.VisibleUserAwards) return []
    return awards.VisibleUserAwards.filter(
      a => COMPLETION_TYPES.has(a.AwardType) && awardDate(a.AwardedAt) === date
    )
  }, [awards, date])

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      title={T.dayModal.title}
      hint={formatWeekdayDay(date, lang)}
      className="gap-3"
      footer={
        day || dayAwards.length > 0 ? (
          <p className="flex flex-wrap items-center text-xs text-text-secondary">
            <Facts items={[plural(day?.count ?? 0, T.plurals.achievements, lang), dayAwards.length > 0 && plural(dayAwards.length, T.plurals.completions, lang)]} />
          </p>
        ) : undefined
      }
    >
      {day || dayAwards.length > 0 ? (
        <PeriodAchievementsDay
          day={day ?? { date, count: 0, points: 0, hasPoints: false, games: [] }}
          onNavigate={onClose}
          hideHead
          above={dayAwards.length > 0 ? <DayAchievementsAwards awards={dayAwards} onNavigate={onClose} /> : undefined}
        />
      ) : (
        <p className="text-sm text-text-secondary text-center py-6">{T.dayModal.empty}</p>
      )}
    </Modal>
  )
}
