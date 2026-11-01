'use client'

import type { ReactNode } from 'react'
import { IconActivity, IconArrowsDiff, IconDeviceGamepad2, IconLayoutDashboard } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useHashTab } from '@/hooks/useHashTab'
import { useProfileLibrary } from '@/hooks/useProfileLibrary'
import type { CheevoUser } from '@/hooks/useCheevoUser'
import MainPageProfileTabs, { profilePanelId, profileTabId } from '@/components/main-page/main-page-profile/main-page-profile-tabs/MainPageProfileTabs'
import PublicUserHero from '../public-user-hero/PublicUserHero'
import PublicUserOverview from '../public-user-overview/PublicUserOverview'
import PublicUserGames from '../public-user-games/PublicUserGames'
import PublicUserActivity from '../public-user-activity/PublicUserActivity'
import PublicUserCompare, { type ViewerStats } from '../public-user-compare/PublicUserCompare'

const ID_PREFIX = 'public-user'
const ALL_TABS = ['overview', 'games', 'activity', 'compare'] as const
// Nothing to compare on your own page.
const OWN_TABS = ['overview', 'games', 'activity'] as const
type Tab = (typeof ALL_TABS)[number]

/**
 * A user's page, read as them (it sits inside SubjectProviders): the hero,
 * then one section at a time, kept in the address (#games…) so it can be
 * linked to and the back button steps through.
 */
export default function PublicUserBody({ user, viewer }: { user: CheevoUser; viewer: ViewerStats }) {
  const { T } = useLanguage()
  const [tab, setTab] = useHashTab<Tab>(user.isSelf ? OWN_TABS : ALL_TABS)
  const { games, isLoading } = useProfileLibrary(user.hiddenGames)

  const labels: Record<Tab, { label: string; icon: ReactNode }> = {
    overview: { label: T.userProfile.tabOverview, icon: <IconLayoutDashboard size={16} aria-hidden="true" /> },
    games: { label: T.userProfile.tabGames, icon: <IconDeviceGamepad2 size={16} aria-hidden="true" /> },
    activity: { label: T.userProfile.tabActivity, icon: <IconActivity size={16} aria-hidden="true" /> },
    compare: { label: T.userProfile.tabCompare, icon: <IconArrowsDiff size={16} aria-hidden="true" /> },
  }
  const tabs = (user.isSelf ? OWN_TABS : ALL_TABS).map((id) => ({ id, ...labels[id] }))

  const panels: Record<Tab, ReactNode> = {
    overview: <PublicUserOverview user={user} games={games} gamesLoading={isLoading} />,
    games: <PublicUserGames games={games} isLoading={isLoading} />,
    activity: <PublicUserActivity />,
    compare: <PublicUserCompare user={user} games={games} gamesLoading={isLoading} viewer={viewer} />,
  }

  return (
    <div className="flex flex-col gap-4">
      <PublicUserHero user={user} onCompare={() => setTab('compare')} />

      <MainPageProfileTabs<Tab> idPrefix={ID_PREFIX} size="md" label={T.userProfile.sectionsLabel} selected={tab} onSelect={setTab} tabs={tabs} />

      <div key={tab} role="tabpanel" id={profilePanelId(ID_PREFIX, tab)} aria-labelledby={profileTabId(ID_PREFIX, tab)} className="min-w-0">
        {panels[tab]}
      </div>
    </div>
  )
}
