'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { RecentAchievement } from '@/types/types'
import DayAchievementsModal from '@/components/day-achievements-modal/DayAchievementsModal'
import { useLanguage } from '@/context/LanguageContext'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const CELL = 10 // px
const GAP = 3 // px
const STEP = CELL + GAP // 13px per column

function getColorClass(count: number): string {
  if (count === 0) return 'bg-bg-main'
  if (count <= 2) return 'bg-accent/20'
  if (count <= 5) return 'bg-accent/40'
  if (count <= 10) return 'bg-accent/70'
  return 'bg-accent'
}

export default function MainPageYearHeatmap({
  achievements,
  isLoading,
  error,
}: {
  achievements: RecentAchievement[]
  isLoading?: boolean
  error?: boolean
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const { T } = useLanguage()

  const { weeks, monthLabels, totalAch, activeDays } = useMemo(() => {
    const byDay: Record<string, number> = {}
    for (const a of achievements) {
      const day = a.Date.split(' ')[0]
      byDay[day] = (byDay[day] ?? 0) + 1
    }

    const activeDays = Object.keys(byDay).length
    const totalAch = achievements.length

    const today = new Date()
    // Align to Sunday 52 full weeks ago
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - today.getDay() - 52 * 7)

    const weeks: Array<Array<{ date: string; count: number }>> = []
    const monthLabels: Array<{ label: string; col: number }> = []
    let lastMonth = -1
    let col = 0

    const cursor = new Date(startDate)
    while (cursor <= today) {
      const week: Array<{ date: string; count: number }> = []
      for (let d = 0; d < 7; d++) {
        if (cursor > today) break
        const key = cursor.toISOString().split('T')[0]
        if (d === 0 && cursor.getMonth() !== lastMonth) {
          monthLabels.push({ label: MONTHS[cursor.getMonth()], col })
          lastMonth = cursor.getMonth()
        }
        week.push({ date: key, count: byDay[key] ?? 0 })
        cursor.setDate(cursor.getDate() + 1)
      }
      weeks.push(week)
      col++
    }

    return { weeks, monthLabels, totalAch, activeDays }
  }, [achievements])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.charts.yearHeatmapTitle}</p>
        {!isLoading && !error && (
          <div className="flex gap-3 text-[10px] text-text-secondary">
            <span>{totalAch.toLocaleString()} {T.lineChart.achievements}</span>
            <span>{activeDays} {T.charts.yearHeatmapActiveDays}</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-text-secondary text-sm">{T.charts.yearHeatmapLoading}</div>
      ) : error ? (
        <div className="flex items-center justify-center py-8 text-text-secondary text-sm" role="alert">{T.charts.failedToLoad}</div>
      ) : (
        <div className="overflow-x-auto pb-1">
          <div className="inline-flex flex-col gap-1">
            {/* Month labels */}
            <div className="relative h-3" style={{ width: `${weeks.length * STEP}px` }}>
              {monthLabels.map((m, i) => (
                <span
                  key={i}
                  className="absolute text-[9px] text-text-secondary"
                  style={{ left: `${m.col * STEP}px` }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            {/* Grid: weeks as columns, days (0=Sun…6=Sat) as rows */}
            <div className="flex gap-0.75">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.75">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      title={day.count > 0 ? `${day.date}: ${day.count} achievement${day.count !== 1 ? 's' : ''}` : day.date}
                      className={`w-2.5 h-2.5 rounded-sm ${getColorClass(day.count)}${day.count > 0 ? ' cursor-pointer hover:ring-1 hover:ring-white/30' : ''}`}
                      onClick={() => day.count > 0 && setSelectedDate(day.date)}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1.5 mt-1 self-end">
              <span className="text-[9px] text-text-secondary">{T.charts.yearHeatmapLess}</span>
              {[0, 1, 3, 6, 11].map((n) => (
                <div key={n} className={`w-2.5 h-2.5 rounded-sm ${getColorClass(n)}`} />
              ))}
              <span className="text-[9px] text-text-secondary">{T.charts.yearHeatmapMore}</span>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedDate && (
          <DayAchievementsModal
            date={selectedDate}
            achievements={achievements}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
