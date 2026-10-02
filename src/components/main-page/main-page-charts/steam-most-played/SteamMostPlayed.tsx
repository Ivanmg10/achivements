'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { formatPlaytime } from '@/utils/steamFeed'
import type { SteamGameProgress } from '@/types/steam'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'

const SHOWN = 5

/**
 * Steam's counterpart to RA's "by console": where the hours went, as short
 * bars against the most played game. Each bar carries its time in text.
 */
export default function SteamMostPlayed({ games }: { games: SteamGameProgress[] }) {
  const { T, lang } = useLanguage()
  const rows = [...games]
    .filter((g) => g.playtimeForever > 0)
    .sort((a, b) => b.playtimeForever - a.playtimeForever)
    .slice(0, SHOWN)
  if (rows.length === 0) return null
  const max = rows[0].playtimeForever
  const units = { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] text-text-secondary/60 uppercase tracking-widest">{T.cards.mostPlayed}</p>
      <ul className="flex flex-col gap-1.5">
        {rows.map((g) => (
          <li key={g.id}>
            <Link
              href={`/steamGame/${g.id}`}
              className="grid grid-cols-[1rem_minmax(0,7rem)_1fr_auto] items-center gap-2 text-xs rounded hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <SteamGameImage appId={g.id} asset="header" iconUrl={g.imageIcon} size={16} className="w-4 h-4 rounded-sm object-cover" />
              <span className="truncate text-text-secondary">{g.title}</span>
              <span aria-hidden="true" className="h-1.5 rounded-full bg-[#66c0f4]/80" style={{ width: `${(g.playtimeForever / max) * 100}%` }} />
              <span className="tabular-nums font-semibold text-text-main">{formatPlaytime(g.playtimeForever, units, lang)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
