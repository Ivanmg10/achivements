'use client'

import { useLanguage } from '@/context/LanguageContext'
import { Skeleton } from '@/components/ui/Skeleton'
import { GameRowSkeleton } from '@/components/ui/GameRowSkeleton'
import MainPageProfileSkeleton from '@/components/main-page/main-page-profile/main-page-profile-skeleton/MainPageProfileSkeleton'

/** A user's page while it loads, in its own shape: the hero with its numbers, the tabs, then the first section. */
export default function PublicUserSkeleton() {
  const { T } = useLanguage()
  return (
    <div role="status" aria-busy="true" className="min-h-full flex flex-col items-center py-4 sm:py-6 px-4">
      <span className="sr-only">{T.userProfile.loadingProfile}</span>
      <div aria-hidden="true" className="w-full lg:max-w-[95%] flex flex-col gap-4">
        <div className="bg-bg-card rounded-card px-4 sm:px-6 pt-6 pb-5 flex flex-col gap-5 min-h-[685px] sm:min-h-[352px]">
          <div className="flex items-center gap-4 sm:gap-5">
            <Skeleton radius="circle" className="w-20 h-20 sm:w-28 sm:h-28 shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className="h-10 sm:h-12 w-48 max-w-full" />
              <Skeleton className="h-3.5 w-28" />
              <Skeleton radius="circle" className="h-6 w-56 max-w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} radius="card" className="h-24" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-5 border-b border-ink/5 h-[49px] sm:h-[34px] overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
          <div className="bg-bg-card rounded-tile p-4 flex flex-col gap-2 min-h-[26rem] lg:min-h-[692px]">
            <Skeleton className="h-8 w-48" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <GameRowSkeleton key={i} />
            ))}
          </div>
          <MainPageProfileSkeleton label="" />
        </div>
      </div>
    </div>
  )
}
