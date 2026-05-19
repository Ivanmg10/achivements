'use client'

import { useMemo } from 'react'
import { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'

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

function getBestMonth(achievements: RecentAchievement[]) {
  const byMonth: Record<string, { pts: number; ach: number }> = {}
  for (const a of achievements) {
    const key = a.Date.slice(0, 7)
    if (!byMonth[key]) byMonth[key] = { pts: 0, ach: 0 }
    byMonth[key].pts += a.Points
    byMonth[key].ach++
  }
  return Object.entries(byMonth).sort((a, b) => b[1].pts - a[1].pts)[0] ?? null
}

function getBestYear(achievements: RecentAchievement[]) {
  const byYear: Record<string, { pts: number; ach: number }> = {}
  for (const a of achievements) {
    const key = a.Date.slice(0, 4)
    if (!byYear[key]) byYear[key] = { pts: 0, ach: 0 }
    byYear[key].pts += a.Points
    byYear[key].ach++
  }
  return Object.entries(byYear).sort((a, b) => b[1].pts - a[1].pts)[0] ?? null
}

export default function MainPageBestPeriod({
  achievements,
  yearAchievements,
  isLoading,
  yearLoading,
}: {
  achievements: RecentAchievement[]
  yearAchievements: RecentAchievement[]
  isLoading?: boolean
  yearLoading?: boolean
}) {
  const { T } = useLanguage()

  const { bestWeek, bestMonth, bestYear } = useMemo(() => ({
    bestWeek: getBestWeek(achievements),
    bestMonth: getBestMonth(achievements),
    bestYear: getBestYear(yearAchievements),
  }), [achievements, yearAchievements])

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
          {bestWeek ? (
            <div className="bg-bg-main rounded-lg p-2.5 flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.bestWeek}</span>
              <span className="text-lg font-bold text-yellow-400">{bestWeek[1].pts.toLocaleString()} pts</span>
              <span className="text-xs text-text-secondary">
                {bestWeek[1].ach} {T.lineChart.achievements} · {T.cards.weekOf.replace('{date}', bestWeek[0])}
              </span>
            </div>
          ) : (
            <div className="bg-bg-main rounded-lg p-2.5 text-xs text-text-secondary">{T.cards.noData}</div>
          )}

          {bestMonth ? (
            <div className="bg-bg-main rounded-lg p-2.5 flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.bestMonth}</span>
              <span className="text-lg font-bold text-accent">{bestMonth[1].pts.toLocaleString()} pts</span>
              <span className="text-xs text-text-secondary">
                {bestMonth[1].ach} {T.lineChart.achievements} · {bestMonth[0]}
              </span>
            </div>
          ) : (
            <div className="bg-bg-main rounded-lg p-2.5 text-xs text-text-secondary">{T.cards.noData}</div>
          )}

          <div className="bg-bg-main rounded-lg p-2.5 flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.bestYear}</span>
            {yearLoading ? (
              <div className="flex flex-col gap-1.5 animate-pulse">
                <div className="h-5 w-24 bg-white/10 rounded" />
                <div className="h-2 w-32 bg-white/10 rounded" />
              </div>
            ) : bestYear ? (
              <>
                <span className="text-lg font-bold text-green-400">{bestYear[1].pts.toLocaleString()} pts</span>
                <span className="text-xs text-text-secondary">
                  {bestYear[1].ach} {T.lineChart.achievements} · {bestYear[0]}
                </span>
              </>
            ) : (
              <span className="text-xs text-text-secondary">{T.cards.noData}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
