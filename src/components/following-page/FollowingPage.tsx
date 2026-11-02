'use client'

import { useMemo } from 'react'
import { IconHeart, IconUsers } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useFriendsData } from '@/hooks/useFriendsData'
import { useFollowers } from '@/hooks/useFollowers'
import { useFollowCounts } from '@/hooks/useFollowCounts'
import { useLocationHash } from '@/hooks/useLocationHash'
import FollowingHero from './following-hero/FollowingHero'
import FollowingRankingsTeaser from './following-rankings-teaser/FollowingRankingsTeaser'
import FollowingTabs, { type FollowingTab } from './following-tabs/FollowingTabs'
import FollowingList from './following-list/FollowingList'

/**
 * The people you follow, newest first, each as a card that opens their
 * profile: the last game they played, their accounts, their latest pins and
 * unlocks, their public groups. Searchable by name and by the platforms they
 * play on (all of those chosen). Beside the title, where the rankings will
 * open from. The cards are our own data; the last game played and the unlocks
 * are read for the newest follows only (DETAIL_LIMIT), as the home's Friends
 * section does. A second tab (`#followers`) lists who follows you, the same
 * cards, read when it is first opened; only you see it.
 */
export default function FollowingPage() {
  const { T } = useLanguage()
  const hash = useLocationHash()
  const tab: FollowingTab = hash === '#followers' ? 'followers' : 'following'
  const { friends, details, isLoading, detailsLoading, error, retry } = useFriendsData(true)
  const fans = useFollowers(tab === 'followers')
  const { counts } = useFollowCounts()
  const users = useMemo(() => friends ?? [], [friends])

  // The tab lives in the address, so /user's "Followers" opens it and Back returns to the other.
  const onTab = (next: FollowingTab) => {
    window.location.hash = next
  }

  return (
    <div className="flex flex-col items-center py-6 px-4">
      <div className="w-full lg:max-w-[98%] flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <FollowingHero users={users} isLoading={isLoading} className="lg:col-span-2" />
          <FollowingRankingsTeaser />
        </div>

        {tab === 'following' ? (
          <FollowingList
            key="following"
            tabs={<FollowingTabs tab={tab} onTab={onTab} counts={counts} />}
            users={users}
            details={details}
            isLoading={(isLoading || detailsLoading) && !error}
            error={error}
            onRetry={retry}
            empty={{ icon: <IconUsers className="w-6 h-6" />, title: T.following.emptyTitle, subtitle: T.following.empty }}
          />
        ) : (
          <FollowingList
            key="followers"
            id="followers"
            tabs={<FollowingTabs tab={tab} onTab={onTab} counts={counts} />}
            users={fans.followers ?? []}
            details={fans.details}
            isLoading={fans.isLoading || fans.detailsLoading}
            error={fans.error}
            onRetry={fans.retry}
            empty={{ icon: <IconHeart className="w-6 h-6" />, title: T.following.noFollowersTitle, subtitle: T.following.noFollowers }}
          />
        )}
      </div>
    </div>
  )
}
