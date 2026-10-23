'use client'

import { IconCheck, IconSearch } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { GameSource } from '@/types/steam'
import { PLATFORM_NAME } from '@/utils/gameRef'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import { fieldClass } from '@/components/ui/Input'

const PLATFORMS = ['ra', 'steam', 'psn', 'xbox'] as const

const CHIP =
  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'
const ON = 'bg-accent/15 text-text-main ring-1 ring-accent font-semibold'
const OFF = 'bg-bg-card text-text-secondary hover:text-text-main'

/**
 * Narrows the people you follow: by name, and by the platforms they play on.
 * Platforms add up — choosing two leaves who has both — and "All" clears
 * them. Each chip says how many play there; only platforms someone has show.
 */
export default function FollowingToolbar({
  query,
  onQuery,
  platforms,
  onPlatforms,
  total,
  counts,
}: {
  query: string
  onQuery: (q: string) => void
  platforms: GameSource[]
  onPlatforms: (p: GameSource[]) => void
  total: number
  counts: Record<GameSource, number>
}) {
  const { T, lang } = useLanguage()
  const toggle = (p: GameSource) => onPlatforms(platforms.includes(p) ? platforms.filter((x) => x !== p) : [...platforms, p])
  const chips = [
    { key: 'all', on: platforms.length === 0, onClick: () => onPlatforms([]), logo: null, label: T.following.allPlatforms, count: total },
    ...PLATFORMS.filter((p) => counts[p] > 0).map((p) => ({
      key: p,
      on: platforms.includes(p),
      onClick: () => toggle(p),
      logo: p,
      label: PLATFORM_NAME[p],
      count: counts[p],
    })),
  ]

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="relative sm:w-64 shrink-0">
        <label htmlFor="following-search" className="sr-only">{T.following.searchLabel}</label>
        <IconSearch size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          id="following-search"
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={T.following.searchPlaceholder}
          className={fieldClass({ size: 'sm', icon: true })}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {chips.map(({ key, on, onClick, logo, label, count }) => (
          <button key={key} type="button" aria-pressed={on} onClick={onClick} className={`${CHIP} ${on ? ON : OFF}`}>
            {on && <IconCheck size={12} aria-hidden="true" className="text-accent" />}
            {logo && <PlatformLogo source={logo} size={12} />}
            {label}
            <span className="tabular-nums opacity-70">{count.toLocaleString(lang)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
