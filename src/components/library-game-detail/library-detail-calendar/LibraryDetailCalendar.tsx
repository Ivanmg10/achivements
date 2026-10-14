'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import MainPageHeatmap from '@/components/main-page/main-page-charts/MainPageHeatmap'
import { calendarEnd, toRecentAchievements, type InsightAchievement, type InsightGame } from '@/utils/gameInsights'

/**
 * The days a game was played, as the calendar of the main page draws them:
 * the same grid, sized to its box, and a click on a day lists what fell on it.
 * It ends today for a game played lately, and where the last unlock was for an
 * old one, so a game left alone for months does not show an empty year.
 */
export default function LibraryDetailCalendar({ items, game }: { items: InsightAchievement[]; game: InsightGame }) {
  const { T } = useLanguage()
  const achievements = useMemo(() => toRecentAchievements(items, game), [items, game])
  const until = useMemo(() => calendarEnd(items), [items])

  if (achievements.length === 0) return <p className="text-sm text-text-secondary text-center py-10">{T.libraryDetail.noneEarned}</p>

  return (
    <div className="flex flex-col h-56">
      <MainPageHeatmap achievements={achievements} until={until} title={T.libraryDetail.calendarTitle} />
    </div>
  )
}
