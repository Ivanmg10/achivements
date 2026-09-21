'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { achievementAnchor } from '@/components/steam/steam-achievement-grid/SteamAchievementGrid'
import { formatRarity } from '@/utils/steamFeed'
import type { SteamAchievementUnified } from '@/types/steam'

const SHOWN = 5
const SKELETON_ROWS = 4

/**
 * The player's rarest unlocks in a game, rarest first. Takes the slot RA's
 * expanded card gives to pinned achievements — that feature runs on RA's
 * favourites API — and uses what Steam has instead: global rarity.
 */
export default function SteamRarestAchievements({
  appId,
  achievements,
  isLoading,
}: {
  appId: number
  achievements: SteamAchievementUnified[]
  isLoading: boolean
}) {
  const { T } = useLanguage()

  const rarest = achievements
    .filter((a) => a.earned && a.globalPct !== null)
    .sort((a, b) => a.globalPct! - b.globalPct!)
    .slice(0, SHOWN)

  return (
    <div className="flex flex-col gap-2 h-full">
      <p className="text-text-secondary text-sm px-1">{T.steam.rarestUnlocked}</p>

      {isLoading ? (
        <ul aria-busy="true" className="flex flex-col gap-2">
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <li key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </ul>
      ) : rarest.length === 0 ? (
        <p className="flex-1 flex items-center justify-center text-center text-sm text-text-secondary px-4 py-6">
          {T.steam.noneUnlocked}
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {rarest.map((a) => (
            <li key={a.apiname}>
              <Link
                href={`/steamGame/${appId}#${achievementAnchor(a.apiname)}`}
                className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4]"
              >
                {a.badgeUrl ? (
                  <Image
                    src={a.badgeUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-lg ring-2 ring-[#66c0f4] shrink-0"
                    unoptimized
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/10 shrink-0" aria-hidden="true" />
                )}
                <span className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate">{a.title}</span>
                  <span className="text-xs text-[#a4d007]">
                    {formatRarity(a.globalPct!)}
                    {T.achievement.haveIt}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
