'use client'

import { useLanguage } from '@/context/LanguageContext'
import { StatCard } from '@/components/ui/StatPill'
import type { XboxSummary } from '@/types/xbox'

/**
 * Four totals in a 2×2 grid — the Xbox side of the PSN stats, with the same
 * StatCard: games, gamerscore, achievements unlocked and the account's tier.
 * Xbox reports no play time in the library, so it takes none of them.
 */
export default function MainPageProfileXboxStats({ summary }: { summary: XboxSummary }) {
  const { T, lang } = useLanguage()

  return (
    <div className="grid grid-cols-2 gap-2">
      <StatCard label={T.steam.statGames} value={summary.games.toLocaleString(lang)} />
      <StatCard label={T.xbox.gamerscore} value={summary.gamerscore.toLocaleString(lang)} accent="text-green-500" />
      <StatCard label={T.xbox.achievements} value={summary.achievementsUnlocked.toLocaleString(lang)} />
      <StatCard label={T.xbox.tier} value={summary.tier || '—'} />
    </div>
  )
}
