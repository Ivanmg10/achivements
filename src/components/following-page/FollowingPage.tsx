'use client'

import { useMemo, useState } from 'react'
import { IconUsers } from '@tabler/icons-react'
import type { GameSource } from '@/types/steam'
import { useLanguage } from '@/context/LanguageContext'
import { useFriendsData } from '@/hooks/useFriendsData'
import { filterFollowing } from '@/utils/friends'
import EmptyState from '@/components/empty-state/EmptyState'
import FollowingPageSkeleton from './following-page-skeleton/FollowingPageSkeleton'
import FollowingHero from './following-hero/FollowingHero'
import FollowingRankingsTeaser from './following-rankings-teaser/FollowingRankingsTeaser'
import FollowingToolbar from './following-toolbar/FollowingToolbar'
import FollowingCard from './following-card/FollowingCard'

/**
 * The people you follow, newest first, each as a card that opens their
 * profile: the last game they played, their accounts, their latest pins and
 * unlocks, their public groups. Searchable by name and by the platforms they
 * play on (all of those chosen). Beside the title, where the rankings will
 * open from. The cards are our own data; the last game played and the unlocks
 * are read for the newest follows only (DETAIL_LIMIT), as the home's Friends
 * section does.
 */
export default function FollowingPage() {
  const { T } = useLanguage()
  const { friends, details, isLoading, error, retry } = useFriendsData(true)
  const users = useMemo(() => friends ?? [], [friends])
  const [query, setQuery] = useState('')
  const [platforms, setPlatforms] = useState<GameSource[]>([])

  const counts = useMemo(
    () => ({
      ra: users.filter((u) => u.ra).length,
      steam: users.filter((u) => u.steam).length,
      psn: users.filter((u) => u.psn).length,
      xbox: users.filter((u) => u.xbox).length,
    }),
    [users],
  )
  const shown = useMemo(() => filterFollowing(users, query, platforms), [users, query, platforms])

  return (
    <div className="flex flex-col items-center py-6 px-4">
      <div className="w-full lg:max-w-[98%] flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <FollowingHero users={users} className="lg:col-span-2" />
          <FollowingRankingsTeaser />
        </div>

        {isLoading ? (
          <FollowingPageSkeleton />
        ) : error ? (
          <div className="bg-bg-card rounded-2xl flex flex-col items-center gap-2 py-10 text-center">
            <p role="alert" className="text-sm text-red-400">{T.following.loadError}</p>
            <button onClick={retry} className="text-sm text-accent hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
              {T.publicProfile.retry}
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-bg-card rounded-2xl">
            <EmptyState icon={<IconUsers className="w-6 h-6" />} title={T.following.emptyTitle} subtitle={T.following.empty} className="py-12" />
          </div>
        ) : (
          <>
            <FollowingToolbar query={query} onQuery={setQuery} platforms={platforms} onPlatforms={setPlatforms} total={users.length} counts={counts} />
            {shown.length === 0 ? (
              <p role="status" className="bg-bg-card rounded-2xl py-10 text-center text-sm text-text-secondary">{T.following.noMatches}</p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[1800px]:grid-cols-5 gap-3">
                {shown.map((u) => (
                  <li key={u.username} className="flex flex-col">
                    <FollowingCard friend={u} lastPlayed={details[u.username]?.lastPlayed} recent={details[u.username]?.recent} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}
