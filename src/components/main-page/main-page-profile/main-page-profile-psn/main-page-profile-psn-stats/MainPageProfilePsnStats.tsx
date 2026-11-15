'use client'

import { useLanguage } from '@/context/LanguageContext'
import Figure from '@/components/ui/Figure'
import { countTrophies, totalPlaytime } from '@/utils/psnTitles'
import { formatPlaytime } from '@/utils/steamFeed'
import type { PsnSummary } from '@/lib/psnClient'
import type { PsnGameProgress } from '@/types/psn'

/**
 * Four totals in a 2×2 grid — the PSN side of the Steam stats, with the same
 * Figure: games, play time (PS4/PS5 games — Sony keeps none for older
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
  const playtime = formatPlaytime(minutes, T.steam, lang)

  return (
    <div className="grid grid-cols-2 gap-2">
      <Figure look="card" label={T.steam.statGames} value={summary.games.toLocaleString(lang)} />
      <Figure look="card" label={T.steam.totalPlaytime} value={playtime} loading={isLoading} />
      <Figure look="card" label={T.psn.platinum} value={summary.earned.platinum.toLocaleString(lang)} tone="platinum" />
      <Figure look="card" label={T.psn.trophies} value={countTrophies(summary.earned).toLocaleString(lang)} />
    </div>
  )
}
