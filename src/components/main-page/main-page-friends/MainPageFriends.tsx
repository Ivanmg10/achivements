'use client'

import { useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { IconAlertTriangle, IconUsers } from '@tabler/icons-react'
import type { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { useFriendsData, DETAIL_LIMIT } from '@/hooks/useFriendsData'
import { useProfileLibrary } from '@/hooks/useProfileLibrary'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { ACTIVITY_DAYS, friendStats, friendsFeed, sharedWithFriends, type LeaderRow } from '@/utils/friends'
import { ChartCard } from '@/components/ui/ChartCard'
import { RememberedHeight } from '@/components/ui/RememberedHeight'
import { SectionFallback } from '@/components/ui/SectionFallback'
import EmptyState from '@/components/empty-state/EmptyState'
import MainPageFriendsLeaderboard from './main-page-friends-leaderboard/MainPageFriendsLeaderboard'
import MainPageFriendsFeed from './main-page-friends-feed/MainPageFriendsFeed'
import MainPageFriendsShared from './main-page-friends-shared/MainPageFriendsShared'
import MainPageFriendsCard from './main-page-friends-card/MainPageFriendsCard'
import MainPageFriendsSkeleton from './main-page-friends-skeleton/MainPageFriendsSkeleton'

/**
 * Stats & Activity's Friends section: how you rank against the people you
 * follow, what they unlocked lately, the games you share and a card for each.
 *
 * Nothing loads until the section is first opened; after that it stays. The
 * cards are our own data, for everyone; the activity and games are read for
 * the newest DETAIL_LIMIT follows only, through the routes their profiles use.
 */
export default function MainPageFriends({ active, myRecent }: { active: boolean; myRecent: RecentAchievement[] }) {
  const { T, lang } = useLanguage()
  const { data: session } = useSession()
  const [opened, setOpened] = useState(false)
  // Opened once is enough: switching away and back keeps what was loaded.
  useWhenChanged([active], () => {
    if (active) setOpened(true)
  })
  const { friends, details, isLoading, detailsLoading, error, retry } = useFriendsData(opened)
  const mine = useProfileLibrary()
  // Read once, when the section opens: every friend's numbers count back from the same moment.
  const [now] = useState(Date.now)

  const detailed = useMemo(() => (friends ?? []).slice(0, DETAIL_LIMIT), [friends])
  const leaderRows: LeaderRow[] = useMemo(() => {
    const me: LeaderRow = {
      username: session?.user?.name ?? T.userProfile.you,
      avatar: session?.user?.avatar ?? null,
      isMe: true,
      stats: friendStats(myRecent, mine.games, now),
    }
    const them = detailed
      .filter((f) => details[f.username])
      .map((f) => ({ username: f.username, avatar: f.avatar, online: f.online, isMe: false, stats: friendStats(details[f.username].recent, details[f.username].games, now) }))
    return [me, ...them]
  }, [session?.user?.name, session?.user?.avatar, T, myRecent, mine.games, now, detailed, details])
  const feed = useMemo(
    () => friendsFeed(detailed.filter((f) => details[f.username]).map((f) => ({ username: f.username, avatar: f.avatar, recent: details[f.username].recent }))),
    [detailed, details],
  )
  const shared = useMemo(
    () => sharedWithFriends(mine.games, detailed.filter((f) => details[f.username]).map((f) => ({ username: f.username, avatar: f.avatar, online: f.online, games: details[f.username].games }))),
    [mine.games, detailed, details],
  )
  const partial = detailed.some((f) => details[f.username]?.partial)

  if (!opened) return null

  if (error) {
    return (
      <ChartCard>
        <SectionFallback error onRefresh={retry}>
          <p className="text-sm text-center py-6">{T.friends.loading}</p>
        </SectionFallback>
      </ChartCard>
    )
  }

  // The whole section at once, never friend by friend (the user's preference). A failed read still lands, as `partial`.
  const loading = isLoading || detailsLoading || mine.isLoading
  if (loading) {
    return (
      <RememberedHeight id="friends" loading>
        <MainPageFriendsSkeleton leaders={friends ? Math.min(friends.length, DETAIL_LIMIT) + 1 : undefined} cards={friends?.length} />
      </RememberedHeight>
    )
  }

  if (!friends || friends.length === 0) {
    return (
      <ChartCard>
        <EmptyState icon={<IconUsers className="w-6 h-6" />} title={T.following.emptyTitle} subtitle={T.following.empty} className="py-10" />
      </ChartCard>
    )
  }

  return (
    <RememberedHeight id="friends" loading={false} className="flex flex-col gap-4">
      {/* Where you stand, and beside it what they did lately, as tall as it (scrolling inside); then who they are, across the width. */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 flex flex-col min-w-0">
          <ChartCard className="h-auto! flex-1">
            <MainPageFriendsLeaderboard rows={leaderRows} />
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-text-secondary">
              <span>{T.friends.windowNote.replace('{n}', String(ACTIVITY_DAYS))}</span>
              {friends.length > DETAIL_LIMIT && <span>{T.friends.limitNote.replace('{n}', String(DETAIL_LIMIT))}</span>}
              {partial && (
                <span className="flex items-center gap-1">
                  <IconAlertTriangle size={12} className="text-warning" aria-hidden="true" />
                  {T.friends.partialNote}
                </span>
              )}
            </p>
          </ChartCard>
        </div>
        {/* Out of the flow on xl, so a long feed never makes the row taller than the leaderboard. */}
        <div className="relative min-w-0">
          <ChartCard className="h-auto! xl:absolute xl:inset-0">
            <MainPageFriendsFeed items={feed} />
          </ChartCard>
        </div>
      </div>

      <ChartCard className="h-auto!">
        <h3 className="text-[10px] uppercase tracking-widest text-text-secondary">
          {T.friends.cards} <span className="tabular-nums">· {friends.length.toLocaleString(lang)}</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {friends.map((f) => (
            <MainPageFriendsCard
              key={f.username}
              friend={f}
              week={details[f.username] ? friendStats(details[f.username].recent, [], now).week : null}
            />
          ))}
        </div>
      </ChartCard>

      <ChartCard>
        <MainPageFriendsShared rows={shared} />
      </ChartCard>
    </RememberedHeight>
  )
}
