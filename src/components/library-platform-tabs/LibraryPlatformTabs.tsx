'use client'

import { useLanguage } from '@/context/LanguageContext'
import Tabs from '@/components/ui/Tabs'
import { PLATFORM_NAME } from '@/utils/gameRef'
import type { GameSource } from '@/types/steam'

export type PlatformChoice = GameSource | 'all'

/** Base of the tabs' ids: the list they show is their panel (`tabIds`). */
export const PLATFORM_TABS_ID = 'library-platform'

/**
 * Which platform's games the list shows, beside the page's title: all of them,
 * or one, each with how many games it has. Only the platforms that have games
 * appear, and with fewer than two there is nothing to choose, so nothing is drawn.
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
  const platforms = (['ra', 'steam', 'psn', 'xbox'] as const).filter((s) => counts[s] > 0)
  if (platforms.length < 2) return null

  const options: { value: PlatformChoice; label: string; n: number }[] = [
    { value: 'all', label: T.libraryFilters.all, n: platforms.reduce((sum, s) => sum + counts[s], 0) },
    ...platforms.map((s) => ({ value: s, label: PLATFORM_NAME[s], n: counts[s] })),
  ]

  return (
    <Tabs
      id={PLATFORM_TABS_ID}
      aria-label={T.libraryLayout.platformLabel}
      className="max-w-full"
      value={value}
      onChange={onChange}
      tabs={options.map((o) => ({ value: o.value, label: o.label, count: o.n }))}
    />
  )
}
