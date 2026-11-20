'use client'

import { memo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useAchievementPins, STEAM_PINS } from '@/hooks/useAchievementPins'
import { formatDate } from '@/utils/dates'
import { steamCompareItem } from '@/utils/gameCompare'
import { useSteamDetailOptions } from '@/hooks/useDetailOptions'
import BadgeGrid from '@/components/badge-grid/BadgeGrid'
import BadgeRarity from '@/components/badge-grid/badge-tip-parts/BadgeRarity'
import BadgeEarnedChip from '@/components/badge-grid/badge-tip-parts/BadgeEarnedChip'
import BadgeGridDetail from '@/components/badge-grid/badge-grid-detail/BadgeGridDetail'
import type { SteamAchievementUnified } from '@/types/steam'

/**
 * A Steam game's achievements in the shared badge grid. Locked ones are the colour badge greyed out (Steam's
 * own grey icons are often too dark to make out). Steam keeps a secret achievement's text hidden until it
 * is unlocked, but gives its picture, so that stays.
 */
export const SteamAchievementGrid = memo(function SteamAchievementGrid({
  appId,
  gameTitle,
  achievements,
  badgeSize = 48,
  limit,
}: {
  appId: number
  gameTitle: string
  achievements: SteamAchievementUnified[]
  badgeSize?: 40 | 48
  /** Show only this many until asked for the rest (a card on a list page). */
  limit?: number
}) {
  const { T, lang } = useLanguage()
  const { pins } = useAchievementPins(STEAM_PINS, appId, gameTitle)
  const options = useSteamDetailOptions()

  return (
    <BadgeGrid<SteamAchievementUnified>
      items={achievements}
      keyOf={(a) => a.apiname}
      detail={(a, shown, onClose) => (
        <BadgeGridDetail item={a} shown={shown} source="steam" gameId={appId} gameTitle={gameTitle} toRow={steamCompareItem} pins={pins} options={options} onClose={onClose} />
      )}
      badgeSize={badgeSize}
      limit={limit}
      name={(a, concealed) => (concealed ? T.steam.hiddenAchievement : a.title)}
      label={(a, name) => `${name} — ${a.earned ? T.steam.earned : T.steam.locked}`}
      earned={(a) => a.earned}
      ring={(a) => (a.earned ? 'ring-steam' : undefined)}
      icon={(a) => a.badgeUrl || null}
      secret={(a) => a.hidden && !a.earned}
      keepSecretIcon
      tip={(a, concealed) => ({
        description: concealed ? T.steam.hiddenAchievementDesc : a.description,
        chips: (
          <>
            <BadgeRarity pct={a.globalPct} />
            <BadgeEarnedChip earned={a.earned} label={T.steam.earned} className="bg-steam/20 text-steam" />
          </>
        ),
        date: a.dateEarned ? formatDate(a.dateEarned, lang) : null,
      })}
    />
  )
})
