'use client'

import { useLanguage } from '@/context/LanguageContext'
import StreakPageSkeleton from '@/components/streak-page/streak-page-skeleton/StreakPageSkeleton'

export default function RachaLoading() {
  const { T } = useLanguage()
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto bg-bg-main text-text-main">
      <div className="flex flex-col gap-5 px-4 py-6 w-full lg:max-w-[98%] mx-auto">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-text-main">{T.streak.title}</h1>
          <p className="text-sm text-text-secondary">{T.streak.pageSub}</p>
        </header>
        <StreakPageSkeleton />
      </div>
    </div>
  )
}
