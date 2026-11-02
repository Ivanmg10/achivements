'use client'

import { useLanguage } from '@/context/LanguageContext'
import GameExpandedStatList from '@/components/game-expanded-stat-list/GameExpandedStatList'

export function GameExpandedMobileStats({
  points,
  totalPoints,
  hardcorePoints,
  completionPct,
  remaining,
}: {
  points: number
  totalPoints: number
  hardcorePoints: number
  completionPct: number
  remaining: number
}) {
  const { T } = useLanguage()

  return (
    <GameExpandedStatList
      stats={[
        { label: T.gameExpanded.points, value: `${points}/${totalPoints}`, className: 'text-hardcore' },
        { label: T.profileStats.hardcorePoints, value: String(hardcorePoints), className: 'text-warning' },
        { label: T.gameExpanded.completion, value: `${completionPct}%`, className: 'text-success', wide: false },
        { label: T.gameExpanded.remaining, value: String(remaining), className: 'text-info' },
      ]}
    />
  )
}
