'use client'

import { memo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useLanguage } from '@/context/LanguageContext'
import { capList, formatDate } from '@/utils/utils'
import { gameHref } from '@/utils/gameRef'
import { BASE_GROUP, psnTrophyAnchor, trophiesByGroup, TROPHY_GRADE_COLOR } from '@/utils/psnTitles'
import ShowAllButton from '@/components/show-all-button/ShowAllButton'
import PsnTrophyGridGroup from './psn-trophy-grid-group/PsnTrophyGridGroup'
import SteamPinAchievementButton from '@/components/steam/steam-pin-achievement-button/SteamPinAchievementButton'
import { usePsnFavoriteTrophies } from '@/hooks/usePsnFavoriteTrophies'
import type { PsnTrophy, PsnTrophyGroup, TrophyGrade } from '@/types/psn'

const SIZE_CLASSES = {
  40: { badge: 'w-10 h-10', img: 40 },
  48: { badge: 'w-12 h-12', img: 48 },
} as const

const TOOLTIP_DELAY_MS = 450

/** The ring an earned trophy gets, in its grade's colour. */
const GRADE_RING: Record<TrophyGrade, string> = {
  platinum: 'ring-sky-300',
  gold: 'ring-yellow-400',
  silver: 'ring-zinc-400',
  bronze: 'ring-orange-400',
}

type Tooltip = { trophy: PsnTrophy; x: number; y: number }

/**
 * A PSN game's trophies as a badge grid, like SteamAchievementGrid: earned
 * ones get a ring in their grade's colour, locked ones are greyed out, and
 * hovering shows the details. Each links to that trophy on the game page.
 * Earned/locked and the grade are in the accessible name too, not only in
 * the colours. A game with DLC shows each group as a fold with its progress —
 * all closed, so every group is in sight without the
 * grid running long. A star in a badge's corner
 * pins it to the main page's pinned card — shown on hover/focus, and always
 * once pinned.
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
  const { T } = useLanguage()
  const { pinned, toggle, canPin } = usePsnFavoriteTrophies(gameId, gameTitle)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const size = SIZE_CLASSES[badgeSize]
  const [showAll, setShowAll] = useState(false)
  const { visible: shown, capped } = capList(trophies, limit ?? Infinity, showAll)
  const grade: Record<TrophyGrade, string> = {
    platinum: T.psn.platinum,
    gold: T.psn.gold,
    silver: T.psn.silver,
    bronze: T.psn.bronze,
  }

  function show(t: PsnTrophy, x: number, y: number, delay = TOOLTIP_DELAY_MS) {
    clearTimeout(hoverTimeout.current)
    hoverTimeout.current = setTimeout(() => setTooltip({ trophy: t, x, y }), delay)
  }

  function hide() {
    clearTimeout(hoverTimeout.current)
    setTooltip(null)
  }

  // Sony keeps the text of hidden trophies secret until they are earned.
  const concealed = (t: PsnTrophy) => t.hidden && !t.earned
  const nameOf = (t: PsnTrophy) => (concealed(t) ? T.psn.hiddenTrophy : t.name)
  const sections = trophiesByGroup(shown, groups)
  const groupName = (id: string) => (id === BASE_GROUP ? T.psn.baseGame : (groups.find((g) => g.id === id)?.name ?? id))

  return (
    <>
      {sections.map((section) => {
        const list = (
          <ul className="flex flex-wrap gap-1">
            {section.trophies.map((t) => (
              <li key={t.id} className="relative group/badge">
                <Link
                  href={`${gameHref('psn', gameId)}#${psnTrophyAnchor(t.id)}`}
                  aria-label={`${nameOf(t)} — ${grade[t.type]}, ${t.earned ? T.psn.earned : T.psn.locked}`}
                  onMouseEnter={(e) => show(t, e.clientX, e.clientY)}
                  onMouseLeave={hide}
                  onFocus={(e) => {
                    const r = e.currentTarget.getBoundingClientRect()
                    show(t, r.right, r.top, 0)
                  }}
                  onBlur={hide}
                  className={`block rounded-lg overflow-hidden shrink-0 transition-transform duration-100 hover:scale-110 focus-visible:scale-110 hover:z-10 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                    t.earned ? `ring-2 ${GRADE_RING[t.type]}` : ''
                  }`}
                >
                  {t.iconUrl && !concealed(t) ? (
                    <Image
                      src={t.iconUrl}
                      alt=""
                      width={size.img}
                      height={size.img}
                      className={`${size.badge} object-cover ${t.earned ? '' : 'grayscale opacity-40'}`}
                      unoptimized
                    />
                  ) : (
                    <div className={`${size.badge} bg-ink/10 ${t.earned ? '' : 'opacity-40'}`} aria-hidden="true" />
                  )}
                </Link>
                {canPin && (
                  <SteamPinAchievementButton
                    pinned={pinned.has(t.id)}
                    title={nameOf(t)}
                    onToggle={() => toggle(t)}
                    size={12}
                    className={`absolute -top-1 -right-1 z-20 w-5 h-5 rounded-full bg-bg-card/90 flex items-center justify-center ${
                      pinned.has(t.id) ? 'opacity-100' : 'opacity-0 group-hover/badge:opacity-100 focus-visible:opacity-100'
                    }`}
                  />
                )}
              </li>
            ))}
          </ul>
        )
        if (sections.length === 1) return <div key={section.groupId}>{list}</div>
        const all = trophies.filter((t) => t.groupId === section.groupId)
        return (
          <PsnTrophyGridGroup
            key={section.groupId}
            name={groupName(section.groupId)}
            earned={all.filter((t) => t.earned).length}
            total={all.length}
          >
            {list}
          </PsnTrophyGridGroup>
        )
      })}
      {capped && <ShowAllButton total={trophies.length} expanded={showAll} onToggle={() => setShowAll((v) => !v)} />}

      {/* Portal so the tooltip escapes any ancestor transform stacking context */}
      {tooltip &&
        createPortal(
          <div
            role="tooltip"
            className="fixed z-50 pointer-events-none bg-bg-card border border-bg-header/80 rounded-xl shadow-2xl p-3 max-w-65"
            style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
          >
            <p className="text-sm font-semibold text-text-main">{nameOf(tooltip.trophy)}</p>
            <p className="text-xs text-text-secondary mt-1 leading-snug">
              {concealed(tooltip.trophy) ? T.psn.hiddenTrophyDesc : tooltip.trophy.detail}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-xs font-semibold ${TROPHY_GRADE_COLOR[tooltip.trophy.type]}`}>{grade[tooltip.trophy.type]}</span>
              {tooltip.trophy.rarity !== null && (
                <span className="text-xs text-text-secondary">
                  {tooltip.trophy.rarity.toFixed(1)}
                  {T.achievement.haveIt}
                </span>
              )}
              {tooltip.trophy.earned ? (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#0070d1]/20 text-[#4da3ff]">{T.psn.earned}</span>
              ) : (
                <span className="text-xs text-text-secondary">{T.achievement.notEarned}</span>
              )}
            </div>
            {tooltip.trophy.earnedAt && <p className="text-xs text-text-secondary mt-1">{formatDate(tooltip.trophy.earnedAt)}</p>}
          </div>,
          document.body,
        )}
    </>
  )
})
