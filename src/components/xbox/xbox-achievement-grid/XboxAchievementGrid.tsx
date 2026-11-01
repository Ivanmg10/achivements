'use client'

import { memo, useRef, useState } from 'react'
import { decimal } from '@/utils/utils'
import Image from 'next/image'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useLanguage } from '@/context/LanguageContext'
import { capList, formatDate } from '@/utils/utils'
import { gameHref } from '@/utils/gameRef'
import { xboxAchievementAnchor } from '@/utils/xboxTitles'
import ConcealedBadge from '@/components/concealed-badge/ConcealedBadge'
import ShowAllButton from '@/components/show-all-button/ShowAllButton'
import XboxRevealAchievementButton from '@/components/xbox/xbox-reveal-achievement-button/XboxRevealAchievementButton'
import SteamPinAchievementButton from '@/components/steam/steam-pin-achievement-button/SteamPinAchievementButton'
import { useRevealedAchievements } from '@/hooks/useRevealedAchievements'
import { useXboxFavoriteAchievements } from '@/hooks/useXboxFavoriteAchievements'
import { useSubject } from '@/context/SubjectContext'
import type { XboxAchievement } from '@/types/xbox'
import { tooltipStyle } from '@/utils/tooltipStyle'
import { TOOLTIP_SURFACE } from '@/components/ui/tooltip'

const SIZE_CLASSES = {
  40: { badge: 'w-10 h-10', img: 40 },
  48: { badge: 'w-12 h-12', img: 48 },
} as const

const TOOLTIP_DELAY_MS = 450

type Tooltip = { achievement: XboxAchievement; x: number; y: number }

/**
 * An Xbox game's achievements as a badge grid, like PsnTrophyGrid: earned ones
 * get a green ring, locked ones are greyed out, and hovering shows the details.
 * Each links to that achievement on the game page. Earned/locked and the
 * gamerscore are in the accessible name too, not only in the colours. Secret
 * ones keep their secret until earned, or until the viewer asks. A star in a
 * badge's corner pins it to the main page's pinned card — shown on hover/focus,
 * and always once pinned.
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
  const { pinned, toggle, canPin } = useXboxFavoriteAchievements(gameId, gameTitle)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const size = SIZE_CLASSES[badgeSize]
  const [showAll, setShowAll] = useState(false)
  const { isRevealed, toggle: toggleReveal } = useRevealedAchievements()
  const { visible: shown, capped } = capList(achievements, limit ?? Infinity, showAll)

  function show(a: XboxAchievement, x: number, y: number, delay = TOOLTIP_DELAY_MS) {
    clearTimeout(hoverTimeout.current)
    hoverTimeout.current = setTimeout(() => setTooltip({ achievement: a, x, y }), delay)
  }

  function hide() {
    clearTimeout(hoverTimeout.current)
    setTooltip(null)
  }

  const concealed = (a: XboxAchievement) => a.secret && !a.unlocked && !isRevealed(a.id)
  const nameOf = (a: XboxAchievement) => (concealed(a) ? T.xbox.secretAchievement : a.name)

  return (
    <>
      <ul className="flex flex-wrap gap-1">
        {shown.map((a) => (
          <li key={a.id} className="relative group/badge">
            <Link
              href={`${gameHref('xbox', gameId, subject)}#${xboxAchievementAnchor(a.id)}`}
              aria-label={`${nameOf(a)} — ${a.gamerscore} G, ${a.unlocked ? T.xbox.earned : T.xbox.locked}`}
              onMouseEnter={(e) => show(a, e.clientX, e.clientY)}
              onMouseLeave={hide}
              onFocus={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                show(a, r.right, r.top, 0)
              }}
              onBlur={hide}
              className={`block rounded-box overflow-hidden shrink-0 transition-transform duration-100 hover:scale-110 focus-visible:scale-110 hover:z-10 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                a.unlocked ? 'ring-2 ring-success' : ''
              }`}
            >
              {a.iconUrl && !concealed(a) ? (
                <Image
                  src={a.iconUrl}
                  alt=""
                  width={size.img}
                  height={size.img}
                  className={`${size.badge} object-cover ${a.unlocked ? '' : 'grayscale opacity-40'}`}
                  unoptimized
                />
              ) : (
                <ConcealedBadge sizeClass={size.badge} dim={!a.unlocked} />
              )}
            </Link>
            {a.secret && !a.unlocked && (
              <XboxRevealAchievementButton
                revealed={isRevealed(a.id)}
                onToggle={() => toggleReveal(a.id)}
                size={20}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-bg-card/90 text-text-main flex items-center justify-center opacity-0 group-hover/badge:opacity-100 focus-visible:opacity-100"
              />
            )}
            {canPin && (
              <SteamPinAchievementButton
                pinned={pinned.has(a.id)}
                title={nameOf(a)}
                onToggle={() => toggle(a)}
                size={12}
                className={`absolute -top-1 -right-1 z-20 w-5 h-5 rounded-full bg-bg-card/90 flex items-center justify-center ${
                  pinned.has(a.id) ? 'opacity-100' : 'opacity-0 group-hover/badge:opacity-100 focus-visible:opacity-100'
                }`}
              />
            )}
          </li>
        ))}
      </ul>
      {capped && <ShowAllButton total={achievements.length} expanded={showAll} onToggle={() => setShowAll((v) => !v)} />}

      {/* Portal so the tooltip escapes any ancestor transform stacking context */}
      {tooltip &&
        createPortal(
          <div
            role="tooltip"
            className={`fixed z-50 pointer-events-none ${TOOLTIP_SURFACE} p-3 max-w-65`}
            style={tooltipStyle(tooltip.x, tooltip.y, window.innerWidth, window.innerHeight)}
          >
            <p className="text-sm font-semibold text-text-main">{nameOf(tooltip.achievement)}</p>
            <p className="text-xs text-text-secondary mt-1 leading-snug">
              {concealed(tooltip.achievement) ? T.xbox.secretAchievementDesc : tooltip.achievement.description}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs font-semibold text-success">{tooltip.achievement.gamerscore} G</span>
              {tooltip.achievement.rarity !== null && (
                <span className="text-xs text-text-secondary">
                  {decimal(tooltip.achievement.rarity, lang)}
                  {T.achievement.haveIt}
                </span>
              )}
              {tooltip.achievement.unlocked ? (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-success/20 text-success">{T.xbox.earned}</span>
              ) : (
                <span className="text-xs text-text-secondary">{T.achievement.notEarned}</span>
              )}
            </div>
            {tooltip.achievement.unlockedAt && <p className="text-xs text-text-secondary mt-1">{formatDate(tooltip.achievement.unlockedAt)}</p>}
          </div>,
          document.body,
        )}
    </>
  )
})
