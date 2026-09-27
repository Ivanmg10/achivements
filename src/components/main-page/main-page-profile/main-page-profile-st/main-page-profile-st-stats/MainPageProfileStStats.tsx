'use client'

import { useLanguage } from '@/context/LanguageContext'
import { StatCard } from '@/components/ui/StatPill'
import { classifySteamGame, formatPlaytime, hasUnloadedProgress } from '@/utils/steamFeed'
import type { SteamGameProgress } from '@/types/steam'

/**
 * Four library totals in a 2×2 grid — the Steam side of MainPageProfileRaStats,
 * with the same StatCard. RA's points become games, playtime, perfect games
 * and achievements unlocked. Counts still being filled in are shown as a
 * lower bound ("12+") rather than a number that looks final.
 */
export default function MainPageProfileStStats({
  library,
  isLoading,
}: {
  library: SteamGameProgress[]
  isLoading: boolean
}) {
  const { T, lang } = useLanguage()

  const partial = hasUnloadedProgress(library) ? '+' : ''
  const minutes = library.reduce((sum, g) => sum + g.playtimeForever, 0)
  const perfect = library.filter((g) => classifySteamGame(g) === 'completed').length
  const unlocked = library.reduce((sum, g) => sum + (g.achievementsLoaded ? g.numAwarded : 0), 0)

  const value = (v: string) => (isLoading ? '—' : v)

  return (
    <div className="grid grid-cols-2 gap-2">
      <StatCard label={T.steam.statGames} value={value(library.length.toLocaleString(lang))} accent="text-[#66c0f4]" />
      <StatCard
        label={T.steam.totalPlaytime}
        value={value(formatPlaytime(minutes, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang))}
      />
      <StatCard label={T.steam.statPerfect} value={value(`${perfect.toLocaleString(lang)}${partial}`)} accent="text-[#a4d007]" />
      <StatCard
        label={T.steam.statAchievements}
        value={value(`${unlocked.toLocaleString(lang)}${partial}`)}
        accent="text-yellow-400"
      />
    </div>
  )
}
