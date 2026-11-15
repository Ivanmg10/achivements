'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { useGamesData } from '@/context/GamesDataContext'
import type { RetroAchievementsUserProfile } from '@/types/types'
import { useUserRank } from '@/hooks/useUserRank'
import { useUserAwards } from '@/hooks/useUserAwards'
import { unlinkRaUser } from '@/utils/apiCallsUtils'
import { raImageUrl } from '@/utils/raAssets'
import UserPlatformCard, { platformStat, PlatformStat } from '@/components/user-page/user-platform-card/UserPlatformCard'
import Button from '@/components/ui/Button'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import RaLogo from '@/components/ra-logo/RaLogo'

// Downloaded the first time it opens, not with the page.
const RaLoginModal = dynamic(() => import('@/components/ra-login-modal/RaLoginModal'), { loading: () => null })

/**
 * RetroAchievements on the account page and on the "connect your accounts" screen: linked
 * in its own modal with the username and Web API key. Its numbers are read only once it is linked.
 */
export default function UserRaCard({ hint }: { hint?: string }) {
  const { data: session, update } = useSession()
  const { T, lang } = useLanguage()
  const { all, inProgress } = useGamesData()
  const { rank, isLoading: rankLoading } = useUserRank()
  const { awards, isLoading: awardsLoading } = useUserAwards()
  const [modalOpen, setModalOpen] = useState(false)

  const raUser = session?.user?.raUser as RetroAchievementsUserProfile | null | undefined
  const connected = Boolean(session?.user?.rausername)

  const stats: PlatformStat[] = [
    { label: T.userStats.globalRank, value: rank?.Rank ? `#${rank.Rank.toLocaleString(lang)}` : '—', loading: rankLoading },
    { label: T.profileStats.hardcorePoints, value: (raUser?.TotalPoints ?? 0).toLocaleString(lang), tone: 'warning' },
    platformStat(T.userStats.masteries, awards?.MasteryAwardsCount, { lang, loading: awardsLoading, tone: 'success' }),
    { label: T.userStats.games, value: all.length.toLocaleString(lang) },
    { label: T.userStats.inProgress, value: inProgress.length.toLocaleString(lang) },
  ]

  return (
    <>
      <UserPlatformCard
        name="RetroAchievements"
        source="ra"
        href={raUser?.User ? `https://retroachievements.org/user/${encodeURIComponent(raUser.User)}` : undefined}
        logo={<RaLogo height={18} />}
        bigLogo={<RaLogo height={40} />}
        gradient="from-ra via-ra/40 to-ra-gold"
        connected={connected}
        hint={hint ?? T.userPage.raConnectHint}
        identity={raUser?.User ? { avatar: raUser.UserPic ? raImageUrl(raUser.UserPic) : null, name: raUser.User, id: raUser.ULID } : null}
        stats={connected ? stats : []}
        disconnect={{ label: T.userConfig.disconnectRA, run: () => unlinkRaUser(update), done: T.toast.raUnlinked }}
        action={
          <Button className="w-full" onClick={() => setModalOpen(true)}>
            <RaLogo height={14} />
            {T.userData.connectRA}
          </Button>
        }
      />
      <LazyWhenOpened open={modalOpen}>
        <RaLoginModal isOpen={modalOpen} setIsOpen={setModalOpen} />
      </LazyWhenOpened>
    </>
  )
}
