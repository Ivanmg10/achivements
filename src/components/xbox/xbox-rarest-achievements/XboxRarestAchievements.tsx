'use client'

import { useLanguage } from '@/context/LanguageContext'
import { gameHref } from '@/utils/gameRef'
import { xboxAchievementAnchor } from '@/utils/xboxTitles'
import type { XboxAchievement } from '@/types/xbox'
import { useSubject } from '@/context/SubjectContext'
import { decimal } from '@/utils/utils'
import RarestEarned, { type RarestRow } from '@/components/rarest-earned/RarestEarned'

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

  const rows = achievements
    .filter((a): a is XboxAchievement & { rarity: number } => a.unlocked && a.rarity !== null)
    .map((a): RarestRow => ({
      key: a.id,
      name: a.name,
      icon: a.iconUrl || null,
      href: `${gameHref('xbox', gameId, subject)}#${xboxAchievementAnchor(a.id)}`,
      rarity: a.rarity,
      subline: (
        <>
          <span className="text-success">{a.gamerscore} G</span>
          <span className="text-text-secondary"> · {T.xbox.rarity.replace('{n}', decimal(a.rarity, lang))}</span>
        </>
      ),
    }))

  return <RarestEarned title={T.xbox.rarestEarned} empty={T.xbox.noneEarned} isLoading={isLoading} rows={rows} ring="ring-success" />
}
