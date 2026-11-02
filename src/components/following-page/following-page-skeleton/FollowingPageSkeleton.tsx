'use client'

import type { ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { Skeleton } from '@/components/ui/Skeleton'
import { RememberedHeight } from '@/components/ui/RememberedHeight'

const CARDS = 8

/** A person to come: the banner, the picture over it, their name, their platforms, and the foot of the card. */
function Card() {
  return (
    <div aria-hidden="true" className="bg-bg-card rounded-card ring-1 ring-inset ring-ink/[0.06] flex flex-col overflow-hidden">
      <Skeleton radius="none" className="h-24" />
      <div className="px-4 pb-4 flex flex-col gap-3 flex-1">
        <div className="relative flex items-end gap-3 -mt-7">
          <Skeleton radius="circle" className="w-15 h-15 shrink-0 ring-4 ring-bg-card" />
          <div className="flex flex-col gap-1.5 flex-1 min-w-0 pb-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Skeleton radius="circle" className="h-6 w-24" />
          <Skeleton radius="circle" className="h-6 w-20" />
        </div>
        {[24, 20].map((w) => (
          <div key={w} className="flex flex-col gap-2">
            <Skeleton className="h-3.5" style={{ width: `${w * 0.25}rem` }} />
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} radius="tile" className="w-11 h-11" />
              ))}
            </div>
          </div>
        ))}
        <div className="mt-auto pt-3 border-t border-ink/[0.06] flex justify-end">
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  )
}

/**
 * The following list while it loads: the search and the platforms on the tabs'
 * line, as the page lays them out, then cards in the shape of the people to
 * come. It stays until everyone's last game and unlocks are in, so nothing fills
 * in card by card. `tabs` is the real tabs, when the page already has them.
 */
export default function FollowingPageSkeleton({ tabs, id = 'following' }: { tabs?: ReactNode; id?: string }) {
  const { T } = useLanguage()
  return (
    <RememberedHeight id={id} loading>
    <div role="status" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">{T.following.loading}</span>
      <div className="flex flex-col xl:flex-row xl:items-end gap-3 xl:gap-4">
        <div className="flex-1 min-w-0">{tabs ?? <Skeleton className="h-11 w-64 max-w-full" />}</div>
        <div aria-hidden="true" className="flex flex-col sm:flex-row sm:items-center gap-3 xl:pb-1.5">
          <Skeleton radius="field" className="h-11 sm:w-[16.25rem] shrink-0" />
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} radius="chip" className="h-8 w-24" />
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[1800px]:grid-cols-5 gap-3">
        {Array.from({ length: CARDS }, (_, i) => (
          <Card key={i} />
        ))}
      </div>
    </div>
    </RememberedHeight>
  )
}
