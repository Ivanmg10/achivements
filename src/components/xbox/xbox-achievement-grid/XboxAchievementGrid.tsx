'use client'

import { memo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import { formatDate } from '@/utils/dates'
import { gameHref } from '@/utils/gameRef'
import { xboxAchievementAnchor } from '@/utils/xboxTitles'
import BadgeGrid from '@/components/badge-grid/BadgeGrid'
import BadgeRarity from '@/components/badge-grid/badge-tip-parts/BadgeRarity'
import BadgeEarnedChip from '@/components/badge-grid/badge-tip-parts/BadgeEarnedChip'
import { useRevealed } from '@/hooks/useRevealed'
import { useXboxRevealSecrets } from '@/hooks/useXboxRevealSecrets'
import { useAchievementPins, XBOX_PINS } from '@/hooks/useAchievementPins'
import type { XboxAchievement } from '@/types/xbox'

/**
 * An Xbox game's achievements in the shared badge grid: earned ones ringed, the gamerscore in the accessible
 * name and the tooltip. Secret ones keep their secret until earned, or until the viewer asks.
 */
export const XboxAchievementGrid = memo(function XboxAchievementGrid({
  gameId,
  gameTitle,
  achievements,
  badgeSize = 48,
  limit,
}: {
  /** The game's numeric id, for the links. */
  gameId: number
  /** For the pinned card. */
  gameTitle: string
  achievements: XboxAchievement[]
  badgeSize?: 40 | 48
  /** Show only this many until asked for the rest. */
  limit?: number
}) {
  const { T, lang } = useLanguage()
  const subject = useSubject()
  const { pins } = useAchievementPins(XBOX_PINS, gameId, gameTitle)
  const reveal = useRevealed(useXboxRevealSecrets()[0], XBOX_PINS.idOf)

  return (
    <BadgeGrid<XboxAchievement>
      items={achievements}
      keyOf={(a) => a.id}
      href={(a) => `${gameHref('xbox', gameId, subject)}#${xboxAchievementAnchor(a.id)}`}
      badgeSize={badgeSize}
      limit={limit}
      name={(a, concealed) => (concealed ? T.xbox.secretAchievement : a.name)}
      label={(a, name) => `${name} — ${a.gamerscore} G, ${a.unlocked ? T.xbox.earned : T.xbox.locked}`}
      earned={(a) => a.unlocked}
      ring={(a) => (a.unlocked ? 'ring-success' : undefined)}
      icon={(a) => a.iconUrl || null}
      secret={(a) => a.secret && !a.unlocked}
      reveal={{ ...reveal, labels: { reveal: T.xbox.revealAchievement, conceal: T.xbox.concealAchievement } }}
      pins={pins}
      tip={(a, concealed) => ({
        description: concealed ? T.xbox.secretAchievementDesc : a.description,
        chips: (
          <>
            <span className="text-xs font-semibold text-success">{a.gamerscore} G</span>
            <BadgeRarity pct={a.rarity} />
            <BadgeEarnedChip earned={a.unlocked} label={T.xbox.earned} className="bg-success/20 text-success" />
          </>
        ),
        date: a.unlockedAt ? formatDate(a.unlockedAt, lang) : null,
      })}
    />
  )
})
