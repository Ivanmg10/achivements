'use client'

import { useLanguage } from '@/context/LanguageContext'
import { StatCard } from '@/components/ui/StatPill'
import { countTrophies, totalPlaytime } from '@/utils/psnTitles'
import { formatPlaytime } from '@/utils/steamFeed'
import type { PsnSummary } from '@/lib/psnClient'
import type { PsnGameProgress } from '@/types/psn'

/**
 * Four totals in a 2×2 grid — the PSN side of the Steam stats, with the same
 * StatCard: games, play time (PS4/PS5 games — Sony keeps none for older
 * ones), platinums and trophies earned.
 */
export default function MainPageProfilePsnStats({
  summary,
  library,
  isLoading,
}: {
  summary: PsnSummary
  library: PsnGameProgress[]
  isLoading: boolean
}) {
  const { T, lang } = useLanguage()
  const minutes = totalPlaytime(library)
  const playtime = isLoading ? '—' : formatPlaytime(minutes, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang)

  return (
    <div className="grid grid-cols-2 gap-2">
      <StatCard label={T.steam.statGames} value={summary.games.toLocaleString(lang)} accent="text-[#0070d1]" />
      <StatCard label={T.steam.totalPlaytime} value={playtime} />
      <StatCard label={T.psn.platinum} value={summary.earned.platinum.toLocaleString(lang)} accent="text-sky-300" />
      <StatCard label={T.psn.trophies} value={countTrophies(summary.earned).toLocaleString(lang)} accent="text-yellow-400" />
    </div>
  )
}
