'use client'

import { useMemo, useState, type ReactNode } from 'react'
import type { GameSource } from '@/types/steam'
import { useLanguage } from '@/context/LanguageContext'
import type { FriendDetails } from '@/hooks/useFriendsData'
import { filterFollowing, type FriendOverview } from '@/utils/friends'
import { RememberedHeight } from '@/components/ui/RememberedHeight'
import EmptyState from '@/components/empty-state/EmptyState'
import FollowingPageSkeleton from '../following-page-skeleton/FollowingPageSkeleton'
import FollowingToolbar from '../following-toolbar/FollowingToolbar'
import FollowingCard from '../following-card/FollowingCard'

/**
 * A list of people as cards (whom you follow, or who follows you): searchable
 * by name and by the platforms they play on, with its loading, failure and
 * empty states. `details` (last game, unlocks) only for those it has them for.
 */
export default function FollowingList({
  users,
  details = {},
  isLoading,
  error,
  onRetry,
  empty,
  tabs,
  id = 'following',
}: {
  users: FriendOverview[]
  details?: Record<string, FriendDetails>
  isLoading: boolean
  error: boolean
  onRetry: () => void
  /** The empty state: an icon, a title and a line under it. */
  empty: { icon: ReactNode; title: string; subtitle: string }
  /** The Following / Followers tabs: the search and the platforms sit on their line, as agreed. */
  tabs?: ReactNode
  /** Which list: each remembers its own height. */
  id?: string
}) {
  const { T } = useLanguage()
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

  if (isLoading) return <FollowingPageSkeleton tabs={tabs} id={id} />
  if (error) {
    return (
      <>
      {tabs}
      <div className="bg-bg-card rounded-card flex flex-col items-center gap-2 py-10 text-center">
        <p role="alert" className="text-sm text-danger">{T.following.loadError}</p>
        <button onClick={onRetry} className="text-sm text-accent hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
          {T.publicProfile.retry}
        </button>
      </div>
      </>
    )
  }
  if (users.length === 0) {
    return (
      <>
        {tabs}
        <div className="bg-bg-card rounded-card">
          <EmptyState icon={empty.icon} title={empty.title} subtitle={empty.subtitle} className="py-12" />
        </div>
      </>
    )
  }

  return (
    <RememberedHeight id={id} loading={false} className="flex flex-col gap-4">
      <div className="flex flex-col xl:flex-row xl:items-end gap-3 xl:gap-4">
        <div className="flex-1 min-w-0">{tabs}</div>
        <FollowingToolbar query={query} onQuery={setQuery} platforms={platforms} onPlatforms={setPlatforms} total={users.length} counts={counts} />
      </div>
      {shown.length === 0 ? (
        <p role="status" className="bg-bg-card rounded-card py-10 text-center text-sm text-text-secondary">{T.following.noMatches}</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[1800px]:grid-cols-5 gap-3 enter-cards">
          {shown.map((u) => (
            <li key={u.username} className="flex flex-col">
              <FollowingCard friend={u} lastPlayed={details[u.username]?.lastPlayed} recent={details[u.username]?.recent} />
            </li>
          ))}
        </ul>
      )}
    </RememberedHeight>
  )
}
