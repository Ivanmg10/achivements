'use client'

import { useLanguage } from '@/context/LanguageContext'
import { GameRowSkeleton } from '@/components/ui/GameRowSkeleton'
import { Skeleton } from '@/components/ui/Skeleton'

const SECTIONS = 3
const ROWS = 3

/** The all-games page while it loads: the three sections (want to play, playing, completed) with their rows. Announced once. */
export default function AllGamesSkeleton() {
  const { T } = useLanguage()

  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">{T.loadingPage.title}</span>
      <div aria-hidden="true" className="flex flex-col gap-4">
        {Array.from({ length: SECTIONS }, (_, s) => (
          <div key={s} className="w-full bg-bg-card rounded-tile overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4">
              <Skeleton className="h-7 w-36" />
              <Skeleton radius="circle" className="h-5 w-10" />
            </div>
            <div className="border-t border-bg-main p-4 flex flex-col gap-2">
              {Array.from({ length: ROWS }, (_, i) => (
                <GameRowSkeleton key={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
