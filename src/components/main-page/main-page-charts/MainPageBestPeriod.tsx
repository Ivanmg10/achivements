'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RecentAchievement } from '@/types/types'
import { getBestMonth } from '@/utils/utils'
import { useLanguage } from '@/context/LanguageContext'
import DayAchievementsModal from '@/components/day-achievements-modal/DayAchievementsModal'
import WeekAchievementsModal from '@/components/week-achievements-modal/WeekAchievementsModal'

function getBestDay(achievements: RecentAchievement[]) {
  const byDay: Record<string, { pts: number; ach: number }> = {}
  for (const a of achievements) {
    const key = a.Date.split(' ')[0]
    if (!byDay[key]) byDay[key] = { pts: 0, ach: 0 }
    byDay[key].pts += a.Points
    byDay[key].ach++
  }
  return Object.entries(byDay).sort((a, b) => b[1].pts - a[1].pts)[0] ?? null
}

function getBestWeek(achievements: RecentAchievement[]) {
  const byWeek: Record<string, { pts: number; ach: number }> = {}
  for (const a of achievements) {
    const d = new Date(a.Date.replace(' ', 'T'))
    const day = d.getDay() || 7
    const monday = new Date(d)
    monday.setDate(d.getDate() - day + 1)
    const key = monday.toISOString().split('T')[0]
    if (!byWeek[key]) byWeek[key] = { pts: 0, ach: 0 }
    byWeek[key].pts += a.Points
    byWeek[key].ach++
  }
  return Object.entries(byWeek).sort((a, b) => b[1].pts - a[1].pts)[0] ?? null
}

export default function MainPageBestPeriod({
  achievements,
  isLoading,
}: {
  achievements: RecentAchievement[]
  isLoading?: boolean
}) {
  const { T } = useLanguage()

  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null)

  const { bestDay, bestWeek, bestMonth } = useMemo(() => ({
    bestDay: getBestDay(achievements),
    bestWeek: getBestWeek(achievements),
    bestMonth: getBestMonth(achievements),
  }), [achievements])

  const monthDays = useMemo(() => {
    if (!expandedMonth || !achievements.length) return []
    const byDay: Record<string, { pts: number; ach: number }> = {}
    for (const a of achievements) {
      const day = a.Date.split(' ')[0]
      if (day.startsWith(expandedMonth)) {
        if (!byDay[day]) byDay[day] = { pts: 0, ach: 0 }
        byDay[day].pts += a.Points
        byDay[day].ach++
      }
    }
    return Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]))
  }, [expandedMonth, achievements])

  const closeDayModal = useCallback(() => setSelectedDay(null), [])
  const closeWeekModal = useCallback(() => setSelectedWeek(null), [])

  const toggleMonth = useCallback((monthKey: string) => {
    setExpandedMonth(prev => prev === monthKey ? null : monthKey)
  }, [])

  return (
    <div className="flex flex-col gap-3 flex-1">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.bestPerformance}</p>

      {isLoading ? (
        <div className="flex flex-col flex-1 justify-between gap-2 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-bg-main rounded-lg p-2.5 flex flex-col gap-1.5">
              <div className="h-2 w-16 bg-white/10 rounded" />
              <div className="h-5 w-24 bg-white/10 rounded" />
              <div className="h-2 w-32 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col flex-1 justify-between gap-2">
          {/* Best Day — purple */}
          {bestDay ? (
            <button
              onClick={() => setSelectedDay(bestDay[0])}
              className="bg-bg-main rounded-lg p-2.5 flex flex-col gap-0.5 text-left cursor-pointer hover:bg-bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70"
            >
              <span className="text-[10px] uppercase tracking-widest text-purple-400">{T.cards.bestDay}</span>
              <span className="text-lg font-bold text-purple-400">{bestDay[1].pts.toLocaleString()} pts</span>
              <span className="text-xs text-text-secondary">
                {bestDay[1].ach} {T.lineChart.achievements} · {T.cards.dayOf.replace('{date}', bestDay[0])}
              </span>
            </button>
          ) : (
            <div className="bg-bg-main rounded-lg p-2.5 text-xs text-text-secondary">{T.cards.noData}</div>
          )}

          {/* Best Week — yellow */}
          {bestWeek ? (
            <button
              onClick={() => setSelectedWeek(bestWeek[0])}
              className="bg-bg-main rounded-lg p-2.5 flex flex-col gap-0.5 text-left cursor-pointer hover:bg-bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/70"
            >
              <span className="text-[10px] uppercase tracking-widest text-yellow-400">{T.cards.bestWeek}</span>
              <span className="text-lg font-bold text-yellow-400">{bestWeek[1].pts.toLocaleString()} pts</span>
              <span className="text-xs text-text-secondary">
                {bestWeek[1].ach} {T.lineChart.achievements} · {T.cards.weekOf.replace('{date}', bestWeek[0])}
              </span>
            </button>
          ) : (
            <div className="bg-bg-main rounded-lg p-2.5 text-xs text-text-secondary">{T.cards.noData}</div>
          )}

          {/* Best Month — red */}
          {bestMonth ? (
            <div className="flex flex-col">
              <button
                onClick={() => toggleMonth(bestMonth[0])}
                className="bg-bg-main rounded-lg p-2.5 flex flex-col gap-0.5 text-left cursor-pointer hover:bg-bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70"
              >
                <span className="text-[10px] uppercase tracking-widest text-red-400">{T.cards.bestMonth}</span>
                <span className="text-lg font-bold text-red-400">{bestMonth[1].pts.toLocaleString()} pts</span>
                <span className="text-xs text-text-secondary">
                  {bestMonth[1].ach} {T.lineChart.achievements} · {bestMonth[0]}
                </span>
              </button>

              <AnimatePresence>
                {expandedMonth === bestMonth[0] && monthDays.length > 0 && (
                  <motion.div
                    className="flex flex-col mt-1 ml-2 border-l-2 border-white/10 pl-2 gap-0.5 overflow-hidden"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {monthDays.map(([day, { pts, ach }]) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className="flex items-center justify-between p-2 rounded-lg bg-bg-main/50 hover:bg-bg-card text-left cursor-pointer transition-colors text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70"
                      >
                        <span className="text-red-300">
                          {new Date(day + 'T00:00:00').toLocaleDateString('default', {
                            weekday: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="text-text-secondary">
                          {pts.toLocaleString()}pts · {ach} {T.dayModal.achievements}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-bg-main rounded-lg p-2.5 text-xs text-text-secondary">{T.cards.noData}</div>
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {selectedDay && (
          <DayAchievementsModal
            date={selectedDay}
            achievements={achievements}
            onClose={closeDayModal}
          />
        )}
        {selectedWeek && (
          <WeekAchievementsModal
            startDate={selectedWeek}
            achievements={achievements}
            onClose={closeWeekModal}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
