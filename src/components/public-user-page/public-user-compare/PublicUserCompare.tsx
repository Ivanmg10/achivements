'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { IconArrowsDiff, IconUser } from '@tabler/icons-react'
import type { RecentAchievement, Streak } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { useStreakData } from '@/hooks/useStreakData'
import type { CheevoUser } from '@/hooks/useCheevoUser'
import { activityKpis } from '@/utils/utils'
import { sharedGames, type LibraryGame } from '@/utils/library'
import EmptyState from '@/components/empty-state/EmptyState'
import PublicUserDuelRow from '../public-user-duel-row/PublicUserDuelRow'
import PublicUserSharedGameRow from '../public-user-shared-game-row/PublicUserSharedGameRow'
import PresenceDot from '@/components/presence-dot/PresenceDot'

/** The signed-in viewer's own numbers, read outside the profile's providers. */
export type ViewerStats = {
  name: string
  avatar: string | null
  games: LibraryGame[]
  year: RecentAchievement[]
  activeStreak: Streak | null
  bestStreak: Streak | null
  isLoading: boolean
}

const SHARED_SHOWN = 24

function Avatar({ src, name, online }: { src: string | null; name: string; online?: boolean }) {
  return (
    <span className="relative shrink-0">
      {src ? (
        <Image src={src} alt="" width={56} height={56} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-bg-card" unoptimized />
      ) : (
        <span aria-hidden="true" title={name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-bg-main flex items-center justify-center">
          <IconUser size={22} className="text-text-secondary" />
        </span>
      )}
      <PresenceDot online={online} announce />
    </span>
  )
}

/**
 * The two of you side by side: pace, streaks and collection, a crown on the
 * side ahead in each; then the games you both play, each opening the two
 * progressions achievement by achievement.
 */
export default function PublicUserCompare({
  user,
  games,
  gamesLoading,
  viewer,
}: {
  user: CheevoUser
  games: LibraryGame[]
  gamesLoading: boolean
  viewer: ViewerStats
}) {
  const { T, lang } = useLanguage()
  const { achievements: theirYear, activeStreak, bestStreak, now, isLoading: yearLoading } = useStreakData()

  const rows = useMemo(() => {
    const them = activityKpis(theirYear, now)
    const me = activityKpis(viewer.year, now)
    const done = (list: LibraryGame[]) => list.filter((g) => g.status === 'completed').length
    const avg = (list: LibraryGame[]) => (list.length ? Math.round(list.reduce((sum, g) => sum + g.pct, 0) / list.length) : 0)
    return [
      { label: T.userProfile.week, theirs: them.week, mine: me.week },
      { label: T.userProfile.month, theirs: them.month, mine: me.month },
      { label: T.userProfile.lastYear, theirs: theirYear.length, mine: viewer.year.length },
      { label: T.userProfile.streak, theirs: activeStreak?.days ?? 0, mine: viewer.activeStreak?.days ?? 0 },
      { label: T.userProfile.bestStreak, theirs: bestStreak?.days ?? 0, mine: viewer.bestStreak?.days ?? 0 },
      { label: T.userProfile.gamesPlayed, theirs: games.length, mine: viewer.games.length },
      { label: T.userProfile.gamesCompleted, theirs: done(games), mine: done(viewer.games) },
      { label: T.userProfile.avgProgress, theirs: avg(games), mine: avg(viewer.games), percent: true },
    ]
  }, [T, theirYear, viewer, now, activeStreak, bestStreak, games])

  const shared = useMemo(() => sharedGames(games, viewer.games), [games, viewer.games])
  const loading = yearLoading || gamesLoading || viewer.isLoading
  const theirWins = rows.filter((r) => r.theirs > r.mine).length
  const myWins = rows.filter((r) => r.mine > r.theirs).length
  const leadText = (side: 'them' | 'me') => T.userProfile.leads.replace('{who}', side === 'them' ? user.username : T.userProfile.you)

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="public-compare-title" className="bg-bg-card rounded-xl p-4 sm:p-6 flex flex-col gap-5">
        <h2 id="public-compare-title" className="sr-only">
          {T.userProfile.compareTitle.replace('{u}', user.username)}
        </h2>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar src={user.avatar} name={user.username} online={user.online} />
            <span className="flex flex-col min-w-0">
              <span className="font-semibold truncate">{user.username}</span>
              {!loading && <span className="text-xs text-text-secondary">{T.userProfile.wins.replace('{n}', String(theirWins))}</span>}
            </span>
          </div>
          <IconArrowsDiff size={22} className="text-text-secondary" aria-hidden="true" />
          <div className="flex items-center justify-end gap-3 min-w-0 text-right">
            <span className="flex flex-col min-w-0">
              <span className="font-semibold truncate">{T.userProfile.you}</span>
              {!loading && <span className="text-xs text-text-secondary">{T.userProfile.wins.replace('{n}', String(myWins))}</span>}
            </span>
            <Avatar src={viewer.avatar} name={viewer.name} />
          </div>
        </div>

        {loading ? (
          <div aria-busy="true" className="flex flex-col gap-4">
            <span className="sr-only">{T.userProfile.loadingCompare}</span>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-9 rounded-lg bg-bg-main animate-pulse motion-reduce:animate-none" />
            ))}
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {rows.map((r) => (
              <PublicUserDuelRow
                key={r.label}
                label={r.label}
                theirs={r.theirs}
                mine={r.mine}
                format={r.percent ? (n) => `${n}%` : (n) => n.toLocaleString(lang)}
                leadText={leadText}
              />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="public-compare-shared" className="bg-bg-card rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="public-compare-shared" className="text-[10px] uppercase tracking-widest text-text-secondary">
            {T.userProfile.sharedGames}
          </h2>
          {!loading && shared.length > 0 && <span className="text-xs text-text-secondary tabular-nums">{shared.length.toLocaleString(lang)}</span>}
        </div>
        {loading ? (
          <div aria-busy="true" className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-24 rounded-xl bg-bg-main animate-pulse motion-reduce:animate-none" />
            ))}
          </div>
        ) : shared.length === 0 ? (
          <EmptyState icon={<IconArrowsDiff className="w-6 h-6" />} title={T.userProfile.noSharedGames} size="compact" className="py-6" />
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {shared.slice(0, SHARED_SHOWN).map((g) => (
              <li key={g.key} className="min-w-0">
                <PublicUserSharedGameRow game={g} username={user.username} />
              </li>
            ))}
          </ul>
        )}
        {shared.length > SHARED_SHOWN && (
          <p className="text-xs text-text-secondary">{T.userProfile.sharedMore.replace('{n}', String(shared.length - SHARED_SHOWN))}</p>
        )}
      </section>
    </div>
  )
}
