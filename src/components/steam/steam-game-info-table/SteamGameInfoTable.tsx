'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import type { SteamAchievementUnified } from '@/types/steam'
import { useAchievementPins, STEAM_PINS } from '@/hooks/useAchievementPins'
import { useSteamDetailOptions } from '@/hooks/useDetailOptions'
import { steamCompareItem } from '@/utils/gameCompare'
import AchievementTable from '@/components/achievement-table/AchievementTable'

/**
 * A Steam game's achievements on the shared table, in Steam's order. Secret ones
 * keep their text until unlocked (Steam gives no way to see it sooner) but show
 * their picture. Guides are searched by the English name.
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
  const { T } = useLanguage()
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
      detail={detail}
      keepSecretIcon
    />
  )
}
