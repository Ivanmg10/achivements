'use client'

import { useXboxSummary } from '@/hooks/useXboxSummary'
import MainPageProfileXboxLinked from './main-page-profile-xbox-linked/MainPageProfileXboxLinked'

/** The Xbox half of the home's profile column; only a linked platform gets a tab (`MainPlatformContext`). */
export default function MainPageProfileXbox() {
  const { summary, isLoading, error, retry } = useXboxSummary()
  return <MainPageProfileXboxLinked summary={summary} isLoading={isLoading} error={error} onRetry={retry} />
}
