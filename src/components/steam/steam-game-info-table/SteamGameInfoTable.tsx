'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { SteamAchievementUnified } from '@/types/steam'
import { useAchievementPins, STEAM_PINS } from '@/hooks/useAchievementPins'
import { useSteamDetailOptions } from '@/hooks/useDetailOptions'
import { steamCompareItem } from '@/utils/gameCompare'
import { plural } from '@/utils/utils'
import AchievementTable from '@/components/achievement-table/AchievementTable'

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
  const { pins } = useAchievementPins(STEAM_PINS, appId, gameTitle)
  const inOrder = useMemo(() => [...achievements].sort((a, b) => a.displayOrder - b.displayOrder), [achievements])
  const detail = useSteamDetailOptions()

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
      pins={pins}
      tags={({ item }) => detail.tags?.(item)}
      notice={{
        match: ({ item }) => item.likelyOnline && !item.earned,
        tone: 'warning',
        lead: (n) => plural(n, T.plurals.onlineCount, lang),
        text: T.gameInfoTable.onlineText,
      }}
      detail={detail}
      keepSecretIcon
    />
  )
}
