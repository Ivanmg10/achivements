'use client'

import { useLanguage } from '@/context/LanguageContext'
import { Skeleton } from '@/components/ui/Skeleton'

/** The groups list while it loads, in the shape of its cards. Announced once. */
export default function GroupListSkeleton() {
  const { T } = useLanguage()
  return (
    <div role="status" aria-busy="true" className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(min(100%,400px),1fr))]">
      <span className="sr-only">{T.loadingPage.title}</span>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} aria-hidden="true" className="flex flex-col h-[232px] sm:h-[268px] bg-bg-card rounded-card overflow-hidden ring-1 ring-inset ring-ink/[0.06]">
          <Skeleton radius="none" className="h-[9.375rem]" />
          <div className="px-5 py-4 flex flex-col gap-2.5">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-2" />
          </div>
        </div>
      ))}
    </div>
  )
}
