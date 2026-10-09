'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { usePsnSummary } from '@/hooks/usePsnSummary'
import MainPageProfilePsnLinked from './main-page-profile-psn-linked/MainPageProfilePsnLinked'

/**
 * The PlayStation half of the main page profile column. Unlinked, it points to
 * the account page where PSN is connected; linked, it shows the PSN profile.
 */
export default function MainPageProfilePsn() {
  const { T } = useLanguage()
  const { isLinked } = usePsnGamesData()
  const { summary, isLoading, error, retry } = usePsnSummary()

  if (!isLinked) {
    return (
      <div className="flex flex-col gap-3 m-2 bg-bg-main rounded-xl w-[95%] p-2">
        <h2 className="text-xl p-1">PlayStation</h2>
        <Link
          href="/user"
          className="w-full text-left bg-bg-card p-3 rounded-3xl hover:scale-[1.03] transition-transform duration-200"
        >
          {T.psn.connect}
        </Link>
      </div>
    )
  }

  return <MainPageProfilePsnLinked summary={summary} isLoading={isLoading} error={error} onRetry={retry} />
}
