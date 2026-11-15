'use client'

import { useLanguage } from '@/context/LanguageContext'
import Figure from '@/components/ui/Figure'
import { formatPlaytime } from '@/utils/steamFeed'
import { totalXboxPlaytime } from '@/utils/xboxTitles'
import type { XboxGameProgress, XboxSummary } from '@/types/xbox'

/**
 * Four totals in a 2×2 grid — the Xbox side of the PSN stats, with the same
 * Figure: games, play time, gamerscore and achievements unlocked. (The tier is
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
  const playtime = minutes === 0 ? '—' : formatPlaytime(minutes, T.steam, lang)

  return (
    <div className="grid grid-cols-2 gap-2">
      <Figure look="card" label={T.steam.statGames} value={summary.games.toLocaleString(lang)} />
      <Figure look="card" label={T.steam.totalPlaytime} value={playtime} loading={isLoading} />
      <Figure look="card" label={T.xbox.gamerscore} value={summary.gamerscore.toLocaleString(lang)} tone="success" />
      <Figure look="card" label={T.xbox.achievements} value={summary.achievementsUnlocked.toLocaleString(lang)} />
    </div>
  )
}
