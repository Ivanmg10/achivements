'use client'

import { memo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import { formatDate } from '@/utils/dates'
import { gameHref } from '@/utils/gameRef'
import { BASE_GROUP, psnTrophyAnchor, trophiesByGroup, TROPHY_GRADE_COLOR, TROPHY_GRADE_RING } from '@/utils/psnTitles'
import BadgeGrid from '@/components/badge-grid/BadgeGrid'
import BadgeRarity from '@/components/badge-grid/badge-tip-parts/BadgeRarity'
import BadgeEarnedChip from '@/components/badge-grid/badge-tip-parts/BadgeEarnedChip'
import PsnTrophyGridGroup from './psn-trophy-grid-group/PsnTrophyGridGroup'
import { useRevealedTrophies } from '@/hooks/useRevealedTrophies'
import { usePsnFavoriteTrophies } from '@/hooks/usePsnFavoriteTrophies'
import type { PsnTrophy, PsnTrophyGroup } from '@/types/psn'

/**
 * A PSN game's trophies in the shared badge grid: earned ones ringed in their grade's colour. A game with
 * DLC shows each group as a fold with its progress, all closed, so every group is in sight without the
 * grid running long. Sony sends a hidden trophy's text, but it is kept secret until earned, or until the
 * viewer asks.
 */
export const PsnTrophyGrid = memo(function PsnTrophyGrid({
  gameId,
  gameTitle,
  trophies,
  groups = [],
  badgeSize = 48,
  limit,
}: {
  /** The game's numeric id, for the links. */
  gameId: number
  /** For the pinned card. */
  gameTitle: string
  trophies: PsnTrophy[]
  /** The game's trophy groups; with more than one, the grid is split by them. */
  groups?: PsnTrophyGroup[]
  badgeSize?: 40 | 48
  /** Show only this many until asked for the rest. */
  limit?: number
}) {
  const { T, lang } = useLanguage()
  const subject = useSubject()
  const { pinned, toggle, canPin } = usePsnFavoriteTrophies(gameId, gameTitle)
  const { isRevealed, toggle: toggleReveal } = useRevealedTrophies()

  const groupName = (id: string) => (id === BASE_GROUP ? T.psn.baseGame : (groups.find((g) => g.id === id)?.name ?? id))

  return (
    <BadgeGrid<PsnTrophy>
      items={trophies}
      keyOf={(t) => t.id}
      href={(t) => `${gameHref('psn', gameId, subject)}#${psnTrophyAnchor(t.id)}`}
      badgeSize={badgeSize}
      limit={limit}
      name={(t, concealed) => (concealed ? T.psn.hiddenTrophy : t.name)}
      label={(t, name) => `${name} — ${T.psn[t.type]}, ${t.earned ? T.psn.earned : T.psn.locked}`}
      earned={(t) => t.earned}
      ring={(t) => (t.earned ? TROPHY_GRADE_RING[t.type] : undefined)}
      icon={(t) => t.iconUrl || null}
      secret={(t) => t.hidden && !t.earned}
      reveal={{ isRevealed: (t) => isRevealed(t.id), toggle: (t) => toggleReveal(t.id), labels: { reveal: T.psn.revealTrophy, conceal: T.psn.concealTrophy } }}
      pins={{ canPin, isPinned: (t) => pinned.has(t.id), toggle }}
      tip={(t, concealed) => ({
        description: concealed ? T.psn.hiddenTrophyDesc : t.detail,
        chips: (
          <>
            <span className={`text-xs font-semibold ${TROPHY_GRADE_COLOR[t.type]}`}>{T.psn[t.type]}</span>
            <BadgeRarity pct={t.rarity} />
            <BadgeEarnedChip earned={t.earned} label={T.psn.earned} className="bg-psn/20 text-psn-light" />
          </>
        ),
        date: t.earnedAt ? formatDate(t.earnedAt, lang) : null,
      })}
      sections={{
        split: (shown) => trophiesByGroup(shown, groups).map((s) => ({ id: s.groupId, items: s.trophies })),
        wrap: (id, list) => {
          const all = trophies.filter((t) => t.groupId === id)
          return (
            <PsnTrophyGridGroup name={groupName(id)} earned={all.filter((t) => t.earned).length} total={all.length}>
              {list}
            </PsnTrophyGridGroup>
          )
        },
      }}
    />
  )
})
