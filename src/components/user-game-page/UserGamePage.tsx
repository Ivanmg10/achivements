'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useCheevoUser } from '@/hooks/useCheevoUser'
import { useViewerGameList } from '@/hooks/useViewerGameList'
import { gameHref, PLATFORM_NAME } from '@/utils/gameRef'
import type { GameSource } from '@/types/steam'
import SubjectProviders from '@/components/subject-providers/SubjectProviders'
import GameInfoSkeleton from '@/components/game-info-skeleton/GameInfoSkeleton'
import PublicUserError from '@/components/public-user-page/public-user-error/PublicUserError'
import UserGamePageBanner from './user-game-page-banner/UserGamePageBanner'
import UserGamePageNotice from './user-game-page-notice/UserGamePageNotice'
import UserGamePageRa from './user-game-page-ra/UserGamePageRa'
import UserGamePageSteam from './user-game-page-steam/UserGamePageSteam'
import UserGamePagePsn from './user-game-page-psn/UserGamePagePsn'

const BODIES = { ra: UserGamePageRa, steam: UserGamePageSteam, psn: UserGamePagePsn }

/**
 * A game as one user has it, at /user/<name>/<platform>/<id>: their progress
 * in it, and — with "compare" on (?compare=1, so it can be linked) — yours
 * beside it. Theirs is read inside SubjectProviders; yours here, outside it.
 */
export default function UserGamePage({ username, source, id }: { username: string; source: GameSource; id: string }) {
  const { T } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { user, isLoading, error, retry } = useCheevoUser(username)
  const comparing = params.get('compare') === '1' && user !== null && !user.isSelf
  const mine = useViewerGameList(source, id, comparing)

  if (error) return <PublicUserError username={username} error={error} onRetry={retry} />
  if (isLoading || !user) return <GameInfoSkeleton />

  const linked = source === 'ra' ? Boolean(user.ra) : source === 'steam' ? user.steam : user.psn
  const gamePageHref = source === 'psn' ? `/psnGame/${id}` : gameHref(source, Number(id))
  const banner = (
    <UserGamePageBanner
      user={user}
      gamePageHref={gamePageHref}
      comparing={comparing}
      onToggleCompare={user.isSelf ? undefined : () => router.replace(comparing ? pathname : `${pathname}?compare=1`, { scroll: false })}
    />
  )

  if (!linked) {
    return (
      <div className="flex flex-col items-center">
        {banner}
        <p className="mt-10 text-sm text-text-secondary">{T.userGame.platformNotLinked.replace('{u}', user.username).replace('{platform}', PLATFORM_NAME[source])}</p>
      </div>
    )
  }

  const Body = BODIES[source]
  const notice = !mine.isLoading && mine.list === null ? <UserGamePageNotice source={source} linked={mine.linked} onRetry={mine.retry} /> : undefined

  return (
    <div className="flex-1 flex flex-col items-center text-text-main relative">
      <SubjectProviders user={user}>
        <Body id={id} username={user.username} banner={banner} comparing={comparing} mine={mine.list} mineLoading={mine.isLoading} notice={notice} />
      </SubjectProviders>
    </div>
  )
}
