'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { classifySteamGame } from '@/utils/steamFeed'
import type { SteamGameProgress } from '@/types/steam'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'

const SHOWN = 8

/**
 * Steam's counterpart to RA's "recent masteries": the games most recently at
 * 100%. Steam reports no completion date, so the last session stands in for
 * it, as on the podium.
 */
export default function SteamRecentPerfects({ games }: { games: SteamGameProgress[] }) {
  const { T } = useLanguage()
  const recent = games
    .filter((g) => classifySteamGame(g) === 'completed' && g.lastPlayed)
    .sort((a, b) => Date.parse(b.lastPlayed!) - Date.parse(a.lastPlayed!))
    .slice(0, SHOWN)
  if (recent.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] text-text-secondary/60 uppercase tracking-widest">{T.cards.recentPerfects}</p>
      <div className="grid grid-cols-4 gap-1.5">
        {recent.map((g) => (
          <Link
            key={g.id}
            href={`/steamGame/${g.id}`}
            title={g.title}
            aria-label={g.title}
            className="relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded"
          >
            <SteamGameImage
              appId={g.id}
              iconUrl={g.imageIcon}
              size={64}
              className="w-full aspect-square object-cover rounded hover:scale-105 transition-transform"
            />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#66c0f4] rounded-full border border-bg-card" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  )
}
