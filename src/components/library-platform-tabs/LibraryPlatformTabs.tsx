'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import { PLATFORM_NAME } from '@/utils/gameRef'
import type { GameSource } from '@/types/steam'

export type PlatformChoice = GameSource | 'all'

/**
 * Which platform's games the list shows, beside the page's title: all of them,
 * or one. The chosen tab is a pill that slides to the next one. Only the
 * platforms that have games appear, and with fewer than two there is nothing
 * to choose, so nothing is drawn.
 */
export default function LibraryPlatformTabs({
  value,
  counts,
  onChange,
}: {
  value: PlatformChoice
  counts: Record<GameSource, number>
  onChange: (platform: PlatformChoice) => void
}) {
  const { T } = useLanguage()
  const reduce = useReducedMotion()
  const platforms = (['ra', 'steam', 'psn', 'xbox'] as const).filter((s) => counts[s] > 0)
  if (platforms.length < 2) return null

  const options: { value: PlatformChoice; label: string; n: number }[] = [
    { value: 'all', label: T.libraryFilters.all, n: platforms.reduce((sum, s) => sum + counts[s], 0) },
    ...platforms.map((s) => ({ value: s, label: PLATFORM_NAME[s], n: counts[s] })),
  ]

  return (
    <div role="group" aria-label={T.libraryLayout.platformLabel} className="flex items-center gap-0.5 bg-ink/[0.06] rounded-control p-[3px] max-w-full overflow-x-auto [scrollbar-width:none]">
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`relative shrink-0 rounded-chip px-3.5 h-8 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
              active ? 'text-bg-main font-semibold' : 'text-text-secondary hover:text-text-main'
            }`}
          >
            {active && (
              <motion.span
                layoutId="library-platform-pill"
                aria-hidden="true"
                className="absolute inset-y-0 inset-x-[3px] rounded-chip bg-accent skew-x-(--slant-pill)"
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {o.value !== 'all' && <PlatformLogo source={o.value} size={15} />}
              {o.label}
              <span className="tabular-nums opacity-70">{o.n}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
