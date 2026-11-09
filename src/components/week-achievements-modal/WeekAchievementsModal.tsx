'use client'

import { useMemo } from 'react'
import { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import RecentAchievementRow from '@/components/recent-achievement-row/RecentAchievementRow'
import Modal from '@/components/ui/Modal'
import { formatDay, utcDay } from '@/utils/dates'

interface Props {
  startDate: string
  achievements: RecentAchievement[]
  onClose: () => void
}

export default function WeekAchievementsModal({ startDate, achievements, onClose }: Props) {
  const { T, lang } = useLanguage()
  // Steam unlocks have no points; a mixed list still totals the RA ones.
  const hasPoints = achievements.some(a => !a.Source || a.Source === 'ra')

  const monday = useMemo(() => new Date(startDate + 'T00:00:00'), [startDate])

  const weekDays = useMemo(() => {
    const days: { date: string; label: string; achievements: RecentAchievement[]; pts: number }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateKey = utcDay(d)
      const dayAchs = achievements.filter(a => a.Date.split(' ')[0] === dateKey)
      if (dayAchs.length > 0) {
        days.push({
          date: dateKey,
          label: d.toLocaleDateString(lang, { weekday: 'long', month: 'short', day: 'numeric' }),
          achievements: dayAchs,
          pts: dayAchs.reduce((s, a) => s + a.Points, 0),
        })
      }
    }
    return days
  }, [achievements, monday])

  const totalPts = weekDays.reduce((s, d) => s + d.pts, 0)
  const totalAch = weekDays.reduce((s, d) => s + d.achievements.length, 0)

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      title={T.cards.bestWeek}
      hint={T.cards.weekOf.replace('{date}', formatDay(startDate, lang, { day: 'numeric', month: 'short', year: 'numeric' }))}
      className="gap-3"
      footer={
        totalAch > 0 ? (
          <p className="text-xs text-text-secondary">
            {totalAch} {T.dayModal.achievements}{hasPoints && ` · ${totalPts.toLocaleString(lang)} ${T.libraryDetail.pointsShort}`}
          </p>
        ) : undefined
      }
    >
        <div className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
          {weekDays.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-6">{T.dayModal.empty}</p>
          ) : (
            weekDays.map(day => (
              <div key={day.date} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-main capitalize">{day.label}</span>
                  <span className="text-[10px] text-text-secondary">
                    {hasPoints && `${day.pts.toLocaleString(lang)} ${T.libraryDetail.pointsShort} · `}{day.achievements.length} {T.dayModal.achievements}
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
        </div>
    </Modal>
  )
}
