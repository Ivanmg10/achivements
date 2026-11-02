'use client'

import { useLanguage } from '@/context/LanguageContext'
import StreakPageSkeleton from '@/components/streak-page/streak-page-skeleton/StreakPageSkeleton'

export default function RachaLoading() {
  const { T } = useLanguage()
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto bg-bg-main text-text-main">
      <div className="flex flex-col gap-4 px-3 py-4 w-full mx-auto">
        <header className="sr-only">
          <h1>{T.streak.title}</h1>
          <p>{T.streak.pageSub}</p>
        </header>
        <StreakPageSkeleton />
      </div>
    </div>
  )
}
