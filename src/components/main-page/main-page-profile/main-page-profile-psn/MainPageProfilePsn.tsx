'use client'

import { usePsnSummary } from '@/hooks/usePsnSummary'
import MainPageProfilePsnLinked from './main-page-profile-psn-linked/MainPageProfilePsnLinked'

/** The PlayStation half of the home's profile column; only a linked platform gets a tab (`MainPlatformContext`). */
export default function MainPageProfilePsn() {
  const { summary, isLoading, error, retry } = usePsnSummary()
  return <MainPageProfilePsnLinked summary={summary} isLoading={isLoading} error={error} onRetry={retry} />
}
