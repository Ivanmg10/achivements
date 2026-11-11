'use client'

import { useLanguage } from '@/context/LanguageContext'
import { gameHref } from '@/utils/gameRef'
import { psnTrophyAnchor, TROPHY_GRADE_COLOR } from '@/utils/psnTitles'
import type { PsnTrophy } from '@/types/psn'
import { useSubject } from '@/context/SubjectContext'
import { decimal } from '@/utils/utils'
import RarestEarned, { type RarestRow } from '@/components/rarest-earned/RarestEarned'

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
  /** A collection's trophies come from several games: each then says its own. */
  trophies: (PsnTrophy & { gameId?: number })[]
  isLoading: boolean
}) {
  const { T, lang } = useLanguage()
  const subject = useSubject()

  const rows = trophies
    .filter((t): t is PsnTrophy & { gameId?: number; rarity: number } => t.earned && t.rarity !== null)
    .map((t): RarestRow => ({
      key: `${t.gameId ?? gameId}:${t.id}`,
      name: t.name,
      icon: t.iconUrl || null,
      href: `${gameHref('psn', t.gameId ?? gameId, subject)}#${psnTrophyAnchor(t.id)}`,
      rarity: t.rarity,
      subline: (
        <>
          <span className={TROPHY_GRADE_COLOR[t.type]}>{T.psn[t.type]}</span>
          <span className="text-text-secondary"> · {T.psn.rarity.replace('{n}', decimal(t.rarity, lang))}</span>
        </>
      ),
    }))

  return <RarestEarned title={T.psn.rarestEarned} empty={T.psn.noneEarned} isLoading={isLoading} rows={rows} ring="ring-psn" />
}
