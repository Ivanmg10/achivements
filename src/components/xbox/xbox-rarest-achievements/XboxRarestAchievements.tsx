'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { gameHref } from '@/utils/gameRef'
import { xboxAchievementAnchor } from '@/utils/xboxTitles'
import type { XboxAchievement } from '@/types/xbox'
import { useSubject } from '@/context/SubjectContext'
import { decimal } from '@/utils/utils'
import { SkeletonRow } from '@/components/ui/SkeletonList'

const SHOWN = 4
const SKELETON_ROWS = 4

/**
 * The player's rarest achievements in a game, rarest first — PsnRarestTrophies'
 * counterpart, in the slot RA's expanded card gives to pinned achievements.
 */
export default function XboxRarestAchievements({
  gameId,
  achievements,
  isLoading,
}: {
  gameId: number
  achievements: XboxAchievement[]
  isLoading: boolean
}) {
  const { T, lang } = useLanguage()
  const subject = useSubject()

  const rarest = achievements
    .filter((a): a is XboxAchievement & { rarity: number } => a.unlocked && a.rarity !== null)
    .sort((a, b) => a.rarity - b.rarity)
    .slice(0, SHOWN)

  return (
    <div className="flex flex-col gap-2 h-full">
      <p className="text-text-secondary text-sm px-1">{T.xbox.rarestEarned}</p>

      {isLoading ? (
        <ul aria-busy="true" className="flex flex-col gap-2">
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <li key={i}><SkeletonRow className="h-12 px-1" /></li>
          ))}
        </ul>
      ) : rarest.length === 0 ? (
        <p className="flex-1 flex items-center justify-center text-center text-sm text-text-secondary px-4 py-6">{T.xbox.noneEarned}</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {rarest.map((a) => (
            <li key={a.id}>
              <Link
                href={`${gameHref('xbox', gameId, subject)}#${xboxAchievementAnchor(a.id)}`}
                className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-ink/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success"
              >
                {a.iconUrl ? (
                  <Image src={a.iconUrl} alt="" width={40} height={40} className="w-10 h-10 rounded-lg object-cover ring-2 ring-success shrink-0" unoptimized />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-ink/10 shrink-0" aria-hidden="true" />
                )}
                <span className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate">{a.name}</span>
                  <span className="text-xs">
                    <span className="text-success">{a.gamerscore} G</span>
                    <span className="text-text-secondary"> · {T.xbox.rarity.replace('{n}', decimal(a.rarity, lang))}</span>
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
