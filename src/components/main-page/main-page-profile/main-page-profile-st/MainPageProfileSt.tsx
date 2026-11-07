'use client'

import { useSteamProfile } from '@/hooks/useSteamProfile'
import MainPageProfileStLinked from './main-page-profile-st-linked/MainPageProfileStLinked'

/** The Steam half of the home's profile column; only a linked platform gets a tab (`MainPlatformContext`). */
export default function MainPageProfileSt() {
  const { profile, isLoading, error, retry } = useSteamProfile()
  return <MainPageProfileStLinked profile={profile} isLoading={isLoading} error={error} onRetry={retry} />
}
