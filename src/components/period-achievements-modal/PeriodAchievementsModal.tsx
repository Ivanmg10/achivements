'use client'

import { useMemo } from 'react'
import { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { formatWeekdayDay } from '@/utils/dates'
import { plural } from '@/utils/utils'
import RecentAchievementRow from '@/components/recent-achievement-row/RecentAchievementRow'
import Modal from '@/components/ui/Modal'
import Facts from '@/components/ui/Facts'

interface Props {
  title: string
  /** A line under the title (the week's first day). */
  hint?: string
  /** What the empty state says. */
  empty?: string
  achievements: RecentAchievement[]
  onClose: () => void
}

/** The unlocks of a week, a month or any stretch, grouped by day, newest day first: the one dialog the best-period cards open. */
export default function PeriodAchievementsModal({ title, hint, empty, achievements, onClose }: Props) {
  const { T, lang } = useLanguage()
  // Points are RA's only: a list that mixes platforms shows counts, not a total that leaves some rows out.
  const hasPoints = achievements.every(a => !a.Source || a.Source === 'ra')

  const days = useMemo(() => {
    const byDay: Record<string, RecentAchievement[]> = {}
    for (const a of achievements) {
      const key = a.Date.split(' ')[0]
      if (!byDay[key]) byDay[key] = []
      byDay[key].push(a)
    }
    return Object.entries(byDay)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, dayAchs]) => ({ date, achievements: dayAchs, pts: dayAchs.reduce((s, a) => s + a.Points, 0) }))
  }, [achievements])

  const totalPts = days.reduce((s, d) => s + d.pts, 0)
  const points = (pts: number) => plural(pts, T.plurals.points, lang)

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      title={title}
      hint={hint}
      className="gap-4"
      footer={
        achievements.length > 0 ? (
          <p className="flex flex-wrap items-center text-xs text-text-secondary">
            <Facts items={[plural(achievements.length, T.plurals.achievements, lang), hasPoints && points(totalPts)]} />
          </p>
        ) : undefined
      }
    >
      {days.length === 0 ? (
        <p className="text-sm text-text-secondary text-center py-6">{empty ?? T.cards.noData}</p>
      ) : (
        days.map(day => (
          <div key={day.date} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-text-main">{formatWeekdayDay(day.date, lang)}</span>
              <span className="flex flex-wrap items-center justify-end text-[10px] text-text-secondary">
                <Facts items={[hasPoints && points(day.pts), plural(day.achievements.length, T.plurals.achievements, lang)]} />
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {day.achievements.map(ach => (
                <RecentAchievementRow key={ach.AchievementID} ach={ach} onNavigate={onClose} />
              ))}
            </div>
          </div>
        ))
      )}
    </Modal>
  )
}
