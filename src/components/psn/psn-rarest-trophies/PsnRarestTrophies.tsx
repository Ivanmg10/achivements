'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { gameHref } from '@/utils/gameRef'
import { psnTrophyAnchor, TROPHY_GRADE_COLOR } from '@/utils/psnTitles'
import type { PsnTrophy } from '@/types/psn'

const SHOWN = 4
const SKELETON_ROWS = 4

/**
 * The player's rarest trophies in a game, rarest first — SteamRarestAchievements'
 * counterpart, in the slot RA's expanded card gives to pinned achievements.
 */
export default function PsnRarestTrophies({
  gameId,
  trophies,
  isLoading,
}: {
  gameId: number
  trophies: PsnTrophy[]
  isLoading: boolean
}) {
  const { T } = useLanguage()
  const grade = { platinum: T.psn.platinum, gold: T.psn.gold, silver: T.psn.silver, bronze: T.psn.bronze }

  const rarest = trophies
    .filter((t): t is PsnTrophy & { rarity: number } => t.earned && t.rarity !== null)
    .sort((a, b) => a.rarity - b.rarity)
    .slice(0, SHOWN)

  return (
    <div className="flex flex-col gap-2 h-full">
      <p className="text-text-secondary text-sm px-1">{T.psn.rarestEarned}</p>

      {isLoading ? (
        <ul aria-busy="true" className="flex flex-col gap-2">
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <li key={i} className="h-12 bg-ink/5 rounded-lg animate-pulse" />
          ))}
        </ul>
      ) : rarest.length === 0 ? (
        <p className="flex-1 flex items-center justify-center text-center text-sm text-text-secondary px-4 py-6">
          {T.psn.noneEarned}
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {rarest.map((t) => (
            <li key={t.id}>
              <Link
                href={`${gameHref('psn', gameId)}#${psnTrophyAnchor(t.id)}`}
                className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070d1]"
              >
                {t.iconUrl ? (
                  <Image src={t.iconUrl} alt="" width={40} height={40} className="w-10 h-10 rounded-lg object-cover ring-2 ring-[#0070d1] shrink-0" unoptimized />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-ink/10 shrink-0" aria-hidden="true" />
                )}
                <span className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate">{t.name}</span>
                  <span className="text-xs">
                    <span className={TROPHY_GRADE_COLOR[t.type]}>{grade[t.type]}</span>
                    <span className="text-text-secondary"> · {T.psn.rarity.replace('{n}', t.rarity.toFixed(1))}</span>
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
