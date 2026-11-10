'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { SteamAchievementUnified } from '@/types/steam'
import { useSteamFavoriteAchievements } from '@/hooks/useSteamFavoriteAchievements'
import { steamCompareItem } from '@/utils/gameCompare'
import { plural } from '@/utils/utils'
import AchievementTable from '@/components/achievement-table/AchievementTable'
import SteamOnlineBadge from '@/components/steam/steam-online-badge/SteamOnlineBadge'

/**
 * A Steam game's achievements on the shared table, in Steam's order. Secret ones
 * keep their text until unlocked (Steam gives no way to see it sooner) but show
 * their picture; the locked ones that likely need online play are named in a
 * line above, which can keep only them: servers close. Guides are searched by
 * the English name.
 */
export default function SteamGameInfoTable({
  achievements,
  appId,
  gameTitle,
}: {
  achievements: SteamAchievementUnified[]
  appId: number
  gameTitle: string
}) {
  const { T, lang } = useLanguage()
  const { pinned, leading, toggle, canPin } = useSteamFavoriteAchievements(appId, gameTitle)
  const inOrder = useMemo(() => [...achievements].sort((a, b) => a.displayOrder - b.displayOrder), [achievements])
  const onlineBadge = (a: SteamAchievementUnified) => (a.likelyOnline ? <SteamOnlineBadge /> : undefined)

  return (
    <AchievementTable
      source="steam"
      gameId={appId}
      gameTitle={gameTitle}
      items={inOrder}
      toRow={steamCompareItem}
      texts={{
        label: T.gameInfoPage.achievements,
        name: T.gameInfoTable.headerAchievement,
        none: T.steam.noAchievements,
        earned: T.steam.earned,
        locked: T.steam.locked,
        secret: T.steam.hiddenAchievement,
        secretText: T.steam.hiddenAchievementDesc,
      }}
      pins={{ canPin, isPinned: (a) => pinned.has(a.apiname), leads: (a) => leading.has(a.apiname), toggle }}
      tags={({ item }) => onlineBadge(item)}
      notice={{
        match: ({ item }) => item.likelyOnline && !item.earned,
        tone: 'warning',
        lead: (n) => plural(n, T.plurals.onlineCount, lang),
        text: T.gameInfoTable.onlineText,
      }}
      detail={{ tags: onlineBadge, guideTitle: (a) => a.titleEn ?? a.title }}
      keepSecretIcon
    />
  )
}
