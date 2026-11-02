'use client'

import { useLanguage } from '@/context/LanguageContext'
import { formatPlaytime } from '@/utils/steamFeed'
import GameExpandedStatList from '@/components/game-expanded-stat-list/GameExpandedStatList'

/**
 * The stat list beside the progress ring in an expanded Steam game — RA's
 * GameExpandedMobileStats with Steam's numbers: playtime in place of points.
 * Like RA's, beside the ring on a phone, under it on a wide screen (without the
 * completion, which the ring already says).
 */
export default function SteamExpandedStats({
  playtimeForever,
  playtime2Weeks,
  completionPct,
  remaining,
}: {
  playtimeForever: number
  playtime2Weeks: number
  completionPct: number
  remaining: number
}) {
  const { T, lang } = useLanguage()
  const units = { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }

  return (
    <GameExpandedStatList
      stats={[
        { label: T.steam.playtime, value: formatPlaytime(playtimeForever, units, lang), className: 'text-[#66c0f4]' },
        { label: T.steam.last2Weeks, value: formatPlaytime(playtime2Weeks, units, lang), className: 'text-text-main' },
        { label: T.gameExpanded.completion, value: `${completionPct}%`, className: 'text-success', wide: false },
        { label: T.gameExpanded.remaining, value: String(remaining), className: 'text-info' },
      ]}
    />
  )
}
