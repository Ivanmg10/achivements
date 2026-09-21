'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useSteamProfile } from '@/hooks/useSteamProfile'
import MainPageProfileStLinked from './main-page-profile-st-linked/MainPageProfileStLinked'

/**
 * The Steam half of the main page profile column. Unlinked, it points to the
 * settings page where Steam is connected; linked, it shows the Steam profile.
 */
export default function MainPageProfileSt() {
  const { T } = useLanguage()
  const { isLinked } = useSteamGamesData()
  const { profile, isLoading, error, retry } = useSteamProfile()

  if (!isLinked) {
    return (
      <div className="flex flex-col gap-3 m-2 bg-bg-main rounded-xl w-[95%] p-2">
        <h2 className="text-xl p-1">Steam</h2>
        <Link
          href="/user"
          className="w-full text-left bg-bg-card p-3 rounded-3xl hover:scale-[1.03] transition-transform duration-200"
        >
          {T.profileSt.signIn}
        </Link>
      </div>
    )
  }

  return <MainPageProfileStLinked profile={profile} isLoading={isLoading} error={error} onRetry={retry} />
}
