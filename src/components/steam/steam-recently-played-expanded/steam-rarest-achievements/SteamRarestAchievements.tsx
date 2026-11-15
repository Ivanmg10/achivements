'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import { gameHref } from '@/utils/gameRef'
import { steamAchievementAnchor } from '@/utils/steamTitles'
import { formatRarity } from '@/utils/steamFeed'
import type { SteamAchievementUnified } from '@/types/steam'
import RarestEarned, { type RarestRow } from '@/components/rarest-earned/RarestEarned'

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
  const { T, lang } = useLanguage()
  const subject = useSubject()

  const rows = achievements
    .filter((a): a is SteamAchievementUnified & { globalPct: number } => a.earned && a.globalPct !== null)
    .map((a): RarestRow => ({
      key: a.apiname,
      name: a.title,
      icon: a.badgeUrl || null,
      href: `${gameHref('steam', appId, subject)}#${steamAchievementAnchor(a.apiname)}`,
      rarity: a.globalPct,
      subline: (
        <span className="text-steam-perfect">
          {formatRarity(a.globalPct, lang)}
          {T.achievement.haveIt}
        </span>
      ),
    }))

  return <RarestEarned title={T.steam.rarestUnlocked} empty={T.steam.noneUnlocked} isLoading={isLoading} rows={rows} ring="ring-steam" />
}
