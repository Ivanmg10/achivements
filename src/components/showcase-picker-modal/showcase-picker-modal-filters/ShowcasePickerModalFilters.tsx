'use client'

import { useLanguage } from '@/context/LanguageContext'
import { PLATFORM_NAME } from '@/utils/gameRef'
import { useScrollFade } from '@/hooks/useScrollFade'
import Pill from '@/components/ui/Pill'
import SearchInput from '@/components/ui/SearchInput'
import { Skeleton } from '@/components/ui/Skeleton'
import type { GameSource } from '@/types/game'

export type ShowcasePlatform = GameSource | 'all'

/**
 * The picker's fixed bar (the Modal's toolbar): the search and, when more than one platform has games, one row of
 * platform chips that scrolls sideways with a fade where it is cut, never wrapping to a second row.
 */
export default function ShowcasePickerModalFilters({
  isLoading,
  query,
  onQuery,
  platform,
  onPlatform,
  counts,
}: {
  isLoading: boolean
  query: string
  onQuery: (q: string) => void
  platform: ShowcasePlatform
  onPlatform: (p: ShowcasePlatform) => void
  /** How many games each platform that has some holds, in the list's order. */
  counts: [GameSource, number][]
}) {
  const { T } = useLanguage()
  const { ref, fade } = useScrollFade()

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
      {isLoading ? (
        <Skeleton radius="field" className="h-10 lg:w-80" />
      ) : (
        <SearchInput
          className="lg:w-80 lg:shrink-0"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={T.showcase.pickerSearch}
          aria-label={T.showcase.pickerSearch}
        />
      )}
      {!isLoading && counts.length > 1 && (
        <div ref={ref} role="group" aria-label={T.showcase.platformFilter} className={`flex gap-1.5 overflow-x-auto min-w-0 lg:flex-1 [scrollbar-width:none] ${fade}`}>
          <Pill pressed={platform === 'all'} onClick={() => onPlatform('all')}>{T.libraryFilters.all}</Pill>
          {counts.map(([s, n]) => (
            <Pill key={s} pressed={platform === s} count={n} onClick={() => onPlatform(s)}>
              {PLATFORM_NAME[s]}
            </Pill>
          ))}
        </div>
      )}
    </div>
  )
}
