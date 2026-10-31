'use client'

import { useLanguage } from '@/context/LanguageContext'
import { Skeleton } from '@/components/ui/Skeleton'
import { SkeletonRow } from '@/components/ui/SkeletonList'

const LEADERS = 5
const CARDS = 6

/** The leaderboard: its title and measures, then each row's place, picture, name with its bar, and figure. */
function Leaderboard({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-3">
      <div aria-hidden="true" className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-3 w-24" />
        <div className="flex flex-wrap gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} radius="chip" className="h-7 w-20" />
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="flex flex-col gap-1">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-1.5">
            <Skeleton radius="circle" className="w-5 h-5 mx-0.5 shrink-0" />
            <Skeleton radius="circle" className="w-7 h-7 shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <Skeleton className="h-3.5 w-32 max-w-full" />
              <Skeleton className="h-1" />
            </div>
            <Skeleton className="h-3.5 w-10 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Stats & Activity's Friends until everyone is read, so the section lands whole: leaderboard and feed, their cards, the shared games. Announced once. */
export default function MainPageFriendsSkeleton({ leaders = LEADERS, cards = CARDS }: { leaders?: number; cards?: number }) {
  const { T } = useLanguage()

  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">{T.friends.loading}</span>
      <div aria-hidden="true" className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-bg-card rounded-tile p-4 xl:col-span-2">
          <Leaderboard rows={leaders} />
        </div>
        <div className="bg-bg-card rounded-tile p-4 flex flex-col gap-3">
          <Skeleton className="h-3 w-24" />
          {[0, 1, 2, 3].map((i) => (
            <SkeletonRow key={i} icon="w-9 h-9" className="px-2 py-1.5 gap-2.5" />
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="bg-bg-card rounded-tile p-4 flex flex-col gap-3">
        <Skeleton className="h-3 w-20" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: cards }, (_, i) => (
            <SkeletonRow key={i} icon="w-12 h-12" radius="circle" figure className="bg-bg-main rounded-tile p-3 gap-3 min-h-[15.75rem] items-start" />
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="bg-bg-card rounded-tile p-4 flex flex-col gap-3">
        <Skeleton className="h-3 w-28" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonRow key={i} icon="w-11 h-11" className="p-2.5 rounded-tile bg-bg-main gap-3" />
          ))}
        </div>
      </div>
    </div>
  )
}
