'use client'

import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { SURFACE } from '@/components/ui/surface'
import { Skeleton } from '@/components/ui/Skeleton'
import RankingsPageSkeleton from './RankingsPageSkeleton'

/** The rankings page before it arrives: its title, its filters, the list and the column beside it, in the page's gutters. Announced once. */
export default function RankingsRouteSkeleton() {
  const { T } = useLanguage()
  const signedIn = useSession().status === 'authenticated'

  return (
    <div role="status" aria-busy="true" className="flex flex-col items-center pt-6 pb-10 px-4 sm:px-8">
      <div className="w-full flex flex-col gap-[1.125rem]">
        <header className="flex flex-col gap-3">
          <h1 className="flex items-center gap-2.5 font-display italic font-extrabold text-5xl sm:text-[4.5rem] leading-[0.88] pr-1">
            {T.rankings.title}
            <span className="not-italic font-sans inline-flex items-center h-[1.375rem] px-2 rounded-tag text-xs font-bold bg-accent/15 text-accent">{T.rankings.beta}</span>
          </h1>
          <p className="text-sm sm:text-[0.9375rem] text-text-secondary">{T.rankings.intro}</p>
        </header>

        <div aria-hidden="true" className="flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-3.5 lg:shadow-[inset_0_-1px_0_rgb(var(--ink)/0.1)]">
          {signedIn ? <Skeleton className="h-11 lg:h-[50px] w-56 max-w-full" /> : <span className="hidden lg:block h-[50px]" />}
          <div className={`flex flex-wrap items-center content-start gap-x-2 gap-y-1 lg:ml-auto lg:mb-1.5 lg:min-h-0 ${signedIn ? 'min-h-[172px]' : 'min-h-[136px]'}`}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} radius="chip" className="h-8 w-14" />
            ))}
            <Skeleton radius="control" className="h-8 w-32" />
            <Skeleton radius="control" className="h-8 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
          <RankingsPageSkeleton />
          <div aria-hidden="true" className={`${SURFACE} p-5 flex flex-col items-center gap-3 lg:min-h-[430px]`}>
            <Skeleton className="self-start h-4 w-24" />
            <Skeleton radius="circle" className="w-36 h-36" />
            <Skeleton radius="tag" className="h-6 w-28" />
            <Skeleton className="h-3.5 w-48 max-w-full" />
            <div className="self-stretch grid grid-cols-3 gap-1.5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} radius="tile" className="h-14" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
