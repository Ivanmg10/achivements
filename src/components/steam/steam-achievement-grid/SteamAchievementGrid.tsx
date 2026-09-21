'use client'

import { memo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useLanguage } from '@/context/LanguageContext'
import { formatDate } from '@/utils/utils'
import type { SteamAchievementUnified } from '@/types/steam'

const SIZE_CLASSES = {
  40: { badge: 'w-10 h-10', img: 40 },
  48: { badge: 'w-12 h-12', img: 48 },
} as const

const TOOLTIP_DELAY_MS = 450

type Tooltip = { achievement: SteamAchievementUnified; x: number; y: number }

/** Anchor id for an achievement row on the Steam game page. */
export function achievementAnchor(apiname: string): string {
  return `ach-${apiname}`
}

/**
 * A Steam game's achievements as a badge grid, matching RA's AchievementGrid:
 * earned badges get a ring, locked ones are the same colour badge greyed out
 * (Steam's own grey icons are often too dark to make out), and hovering shows
 * the details.
 *
 * Each badge links to that achievement on the game page. Earned/locked is in
 * the accessible name too, not only in the greyscale.
 */
export const SteamAchievementGrid = memo(function SteamAchievementGrid({
  appId,
  achievements,
  badgeSize = 48,
}: {
  appId: number
  achievements: SteamAchievementUnified[]
  badgeSize?: 40 | 48
}) {
  const { T } = useLanguage()
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const size = SIZE_CLASSES[badgeSize]

  function show(a: SteamAchievementUnified, x: number, y: number, delay = TOOLTIP_DELAY_MS) {
    clearTimeout(hoverTimeout.current)
    hoverTimeout.current = setTimeout(() => setTooltip({ achievement: a, x, y }), delay)
  }

  function hide() {
    clearTimeout(hoverTimeout.current)
    setTooltip(null)
  }

  // Steam keeps the text of secret achievements hidden until they are unlocked.
  const concealed = (a: SteamAchievementUnified) => a.hidden && !a.earned
  const titleOf = (a: SteamAchievementUnified) => (concealed(a) ? T.steam.hiddenAchievement : a.title)

  return (
    <>
      <ul className="flex flex-wrap gap-1">
        {achievements.map((a) => (
          <li key={a.apiname}>
            <Link
              href={`/steamGame/${appId}#${achievementAnchor(a.apiname)}`}
              aria-label={`${titleOf(a)} — ${a.earned ? T.steam.earned : T.steam.locked}`}
              onMouseEnter={(e) => show(a, e.clientX, e.clientY)}
              onMouseLeave={hide}
              onFocus={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                show(a, r.right, r.top, 0)
              }}
              onBlur={hide}
              className={`block rounded-lg overflow-hidden shrink-0 transition-transform duration-100 hover:scale-110 focus-visible:scale-110 hover:z-10 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                a.earned ? 'ring-2 ring-[#66c0f4]' : ''
              }`}
            >
              {a.badgeUrl ? (
                <Image
                  src={a.badgeUrl}
                  alt=""
                  width={size.img}
                  height={size.img}
                  className={`${size.badge} object-cover ${a.earned ? '' : 'grayscale opacity-40'}`}
                  unoptimized
                />
              ) : (
                <div className={`${size.badge} bg-white/10 ${a.earned ? '' : 'opacity-40'}`} aria-hidden="true" />
              )}
            </Link>
          </li>
        ))}
      </ul>

      {/* Portal so the tooltip escapes any ancestor transform stacking context */}
      {tooltip &&
        createPortal(
          <div
            role="tooltip"
            className="fixed z-50 pointer-events-none bg-bg-card border border-bg-header/80 rounded-xl shadow-2xl p-3 max-w-65"
            style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
          >
            <p className="text-sm font-semibold text-text-main">{titleOf(tooltip.achievement)}</p>
            <p className="text-xs text-text-secondary mt-1 leading-snug">
              {concealed(tooltip.achievement) ? T.steam.hiddenAchievementDesc : tooltip.achievement.description}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {tooltip.achievement.globalPct !== null && (
                <span className="text-xs text-text-secondary">
                  {tooltip.achievement.globalPct.toFixed(1)}
                  {T.achievement.haveIt}
                </span>
              )}
              {tooltip.achievement.earned ? (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#66c0f4]/20 text-[#66c0f4]">
                  {T.steam.earned}
                </span>
              ) : (
                <span className="text-xs text-text-secondary/60">{T.achievement.notEarned}</span>
              )}
            </div>
            {tooltip.achievement.dateEarned && (
              <p className="text-xs text-text-secondary/60 mt-1">{formatDate(tooltip.achievement.dateEarned)}</p>
            )}
          </div>,
          document.body,
        )}
    </>
  )
})
