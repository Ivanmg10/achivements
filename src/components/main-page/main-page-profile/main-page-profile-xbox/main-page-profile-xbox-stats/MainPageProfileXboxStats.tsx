'use client'

import { useLanguage } from '@/context/LanguageContext'
import { StatCard } from '@/components/ui/StatPill'
import { formatPlaytime } from '@/utils/steamFeed'
import { totalXboxPlaytime } from '@/utils/xboxTitles'
import type { XboxGameProgress, XboxSummary } from '@/types/xbox'

/**
 * Four totals in a 2×2 grid — the Xbox side of the PSN stats, with the same
 * StatCard: games, play time, gamerscore and achievements unlocked. (The tier is
 * in the profile's header.) Play time is the sum of what Xbox reports per game.
 */
export default function MainPageProfileXboxStats({
  summary,
  library,
  isLoading,
}: {
  summary: XboxSummary
  library: XboxGameProgress[]
  isLoading: boolean
}) {
  const { T, lang } = useLanguage()
  const minutes = totalXboxPlaytime(library)
  const playtime = isLoading || minutes === 0 ? '—' : formatPlaytime(minutes, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang)

  return (
    <div className="grid grid-cols-2 gap-2">
      <StatCard label={T.steam.statGames} value={summary.games.toLocaleString(lang)} />
      <StatCard label={T.steam.totalPlaytime} value={playtime} />
      <StatCard label={T.xbox.gamerscore} value={summary.gamerscore.toLocaleString(lang)} accent="text-success" />
      <StatCard label={T.xbox.achievements} value={summary.achievementsUnlocked.toLocaleString(lang)} />
    </div>
  )
}
