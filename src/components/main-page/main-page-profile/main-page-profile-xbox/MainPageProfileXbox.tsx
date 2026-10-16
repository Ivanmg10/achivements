'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useXboxSummary } from '@/hooks/useXboxSummary'
import MainPageProfileXboxLinked from './main-page-profile-xbox-linked/MainPageProfileXboxLinked'

/**
 * The Xbox half of the main page profile column. Unlinked, it points to the
 * account page where Xbox is connected; linked, it shows the Xbox profile.
 */
export default function MainPageProfileXbox() {
  const { T } = useLanguage()
  const { isLinked } = useXboxGamesData()
  const { summary, isLoading, error, retry } = useXboxSummary()

  if (!isLinked) {
    return (
      <div className="flex flex-col gap-3 m-2 bg-bg-main rounded-xl w-[95%] p-2">
        <h2 className="text-xl p-1">Xbox</h2>
        <Link
          href="/user"
          className="w-full text-left bg-bg-card p-3 rounded-3xl hover:scale-[1.03] transition-transform duration-200"
        >
          {T.xbox.connect}
        </Link>
      </div>
    )
  }

  return <MainPageProfileXboxLinked summary={summary} isLoading={isLoading} error={error} onRetry={retry} />
}
