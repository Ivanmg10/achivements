'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { IconChevronDown } from '@tabler/icons-react'
import type { FeedGameCardView, FeedRing } from '@/types/gameCard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import Tag from '@/components/ui/Tag'
import Facts from '@/components/ui/Facts'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import { PLATFORM_LOGO } from '@/components/game-card-platform-tag/GameCardPlatformTag'

const ICON_RING: Record<FeedRing, string> = {
  platinum: 'ring-2 ring-platinum',
  success: 'ring-2 ring-success',
  warning: 'ring-2 ring-warning',
}

const ICON_CLASS = 'rounded-tile w-14 h-14 sm:w-16 sm:h-16 shadow-[0_6px_18px_rgb(0_0_0/0.45)]'
const TITLE_CLASS = 'text-[1.0625rem] font-extrabold block truncate leading-tight'

/**
 * A game as a compact row in the recent feed, for every platform: the art behind it, an icon and title
 * that open the game, the platform's chip, the bar with its percentage, a line of facts and the pin. The
 * rest of the row is the expand button (a real one, stretched over the whole row, so the pin and the
 * links stay above it); opened, the platform's achievements or trophies take the row below. What a
 * platform tells is its adapter's (RaGameItem, SteamGameItem, PsnGameItem, XboxGameItem, PsnCollectionItem).
 * Controlled when `expanded` and `onToggle` come (the feed opens one at a time), local otherwise.
 */
export default function FeedGameCard({
  href,
  title,
  backdrop,
  icon,
  iconBadge,
  ring,
  platform,
  progress,
  facts,
  expand,
  pin,
  expanded,
  onToggle,
  className = '',
  children,
}: FeedGameCardView) {
  const [localOpen, setLocalOpen] = useState(false)
  const panelId = useId()
  const open = expanded ?? localOpen
  const toggle = onToggle ?? (() => setLocalOpen((v) => !v))
  const Logo = platform.source ? PLATFORM_LOGO[platform.source] : null
  const picture = icon(`${ICON_CLASS} ${href ? 'transition-transform duration-300 hover:scale-105' : ''} ${ring ? ICON_RING[ring] : 'ring-1 ring-ink/10'}`)

  return (
    <div className={`relative isolate bg-bg-main rounded-card overflow-hidden flex flex-col min-h-0 ring-1 ring-ink/[0.04] ${className}`}>
      <GameCardBackdrop src={backdrop} />

      {/* relative: the expand button stretches over this whole row. */}
      <div className="relative flex items-center gap-3.5 px-3.5 py-2 shrink-0">
        {href ? (
          // Same destination as the title link, so it is kept out of the tab order.
          <Link href={href} tabIndex={-1} aria-hidden="true" className="relative z-10 shrink-0">
            {picture}
            {iconBadge}
          </Link>
        ) : (
          <span className="shrink-0">{picture}</span>
        )}

        <div className="flex flex-col min-w-0 flex-1 gap-1">
          <span className="flex items-center gap-2 min-w-0">
            {href ? (
              <Link href={href} className="relative z-10 w-fit max-w-full min-w-0 hover:underline underline-offset-2 decoration-ink/40 rounded focus-ring">
                <span className={TITLE_CLASS}>{title}</span>
              </Link>
            ) : (
              <span className={TITLE_CLASS}>{title}</span>
            )}
            <Tag size="sm" tone="overlay" className="shrink-0 max-w-[45%] truncate">
              {Logo && <Logo size={12} className="opacity-60" aria-hidden="true" />}
              {platform.label}
            </Tag>
          </span>

          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`${open ? expand.hide : expand.show}: ${title}`}
            className="flex flex-col gap-1 w-full text-left rounded cursor-pointer before:absolute before:inset-0 before:content-[''] focus-ring group"
          >
            <span className="flex items-center gap-2 w-full">
              {progress && (
                <>
                  <ProgressBar pct={progress.pct} softPct={progress.softPct} label={title} className="flex-1" />
                  <span className={`text-base font-extrabold tabular-nums shrink-0 w-[2.625rem] text-right ${progress.done ? 'text-success' : 'text-text-main'}`}>
                    {progress.percent}%
                  </span>
                </>
              )}
              <IconChevronDown
                size={14}
                aria-hidden="true"
                className={`ml-auto shrink-0 text-text-secondary/40 group-hover:text-text-secondary transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </span>

            <span className="flex flex-wrap items-center text-[0.8125rem] text-text-secondary">
              <Facts items={facts} />
            </span>
          </button>
        </div>

        {/* Outside the expand button (a button inside a button is invalid HTML), and above its stretched hit area. */}
        {pin && <PinToggleButton gameId={pin.gameId} source={pin.source} className="self-center relative z-10" />}
      </div>

      {open && (
        <div id={panelId} className="flex-1 overflow-y-auto px-3 pb-3 pt-3 min-h-0 w-full">
          {children}
        </div>
      )}
    </div>
  )
}
