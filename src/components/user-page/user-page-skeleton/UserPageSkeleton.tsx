'use client'

import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { canUseXbox } from '@/utils/xboxAccess'
import { Skeleton } from '@/components/ui/Skeleton'

const CARD = 'bg-bg-card rounded-card ring-1 ring-inset ring-ink/[0.06]'

/** The account page while it loads, in its own layout: identity and delete on the left, preferences beside them, the platforms below. Announced once. */
export default function UserPageSkeleton() {
  const { T } = useLanguage()
  const { data: session } = useSession()
  // Xbox's card only for who may use it, as the page does.
  const platforms = canUseXbox(session?.user?.admin) ? 4 : 3

  return (
    <div role="status" aria-busy="true" className="min-h-screen bg-bg-main text-text-main flex flex-col items-center py-6 px-4">
      <span className="sr-only">{T.loadingPage.title}</span>
      <div aria-hidden="true" className="w-full lg:max-w-[95%] flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
          <div className="flex flex-col gap-4 min-w-0">
            {/* Identity: picture and name, the buttons, the level and the figures */}
            <div className={`${CARD} px-4 sm:px-7 py-6 sm:py-7 flex flex-col gap-4 min-h-[63rem] lg:min-h-[589px]`}>
              <div className="flex items-end justify-between gap-x-5 gap-y-4 flex-wrap">
                <div className="flex items-end gap-4 sm:gap-[1.375rem] min-w-0">
                  <Skeleton radius="circle" className="w-24 h-24 sm:w-28 sm:h-28 shrink-0" />
                  <div className="flex flex-col gap-2 pb-1">
                    <Skeleton className="h-10 sm:h-14 w-44 max-w-full" />
                    <Skeleton className="h-3.5 w-40 max-w-full" />
                  </div>
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  <Skeleton radius="button" className="h-9 w-28" />
                  <Skeleton radius="button" className="h-9 w-28" />
                </div>
              </div>
              <Skeleton radius="tile" className="h-28" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 flex-1">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} radius="tile" className="min-h-24" />
                ))}
              </div>
            </div>

            {/* Delete account */}
            <div className={`${CARD} p-6 flex flex-col sm:flex-row sm:items-center gap-4 min-h-[179px] lg:min-h-[88px]`}>
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton radius="button" className="h-9 w-32" />
            </div>
          </div>

          {/* Preferences: the tabs, then each choice */}
          <div className={`${CARD} p-6 flex flex-col gap-5 min-h-[804px] lg:min-h-[712px]`}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton radius="control" className="h-8 w-1/3" />
              </div>
            ))}
          </div>
        </div>

        {/* Platforms: the logo, the account, the figures */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: platforms }, (_, i) => (
            <div key={i} className={`${CARD} p-5 flex flex-col gap-3 min-h-[441px] md:min-h-[458px]`}>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton radius="tile" className="h-16" />
              <div className="grid grid-cols-2 gap-1.5 flex-1 content-start">
                {[0, 1, 2, 3].map((n) => (
                  <Skeleton key={n} radius="tile" className="h-[4.25rem]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
