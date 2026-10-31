'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import UserPlatformCard, {
  CONNECT_CLASS,
  DISCONNECT_CLASS,
  PlatformStat,
} from '@/components/user-page/user-platform-card/UserPlatformCard'
import UserPsnCard from '@/components/user-page/user-psn-card/UserPsnCard'
import UserXboxCard from '@/components/user-page/user-xbox-card/UserXboxCard'
import { useXboxEnabled } from '@/hooks/useXboxEnabled'
import UserSteamCard from '@/components/user-page/user-steam-card/UserSteamCard'
import RaLoginModal from '@/components/ra-login-modal/RaLoginModal'
import RaLogo from '@/components/ra-logo/RaLogo'
import { useLanguage } from '@/context/LanguageContext'
import { useGamesData } from '@/context/GamesDataContext'
import { useUserRank } from '@/hooks/useUserRank'
import { useUserAwards } from '@/hooks/useUserAwards'
import { unlinkRaUser } from '@/utils/apiCallsUtils'
import { RetroAchievementsUserProfile } from '@/types/types'
import { notify } from '@/lib/notify'

/** A dash rather than a zero while the numbers are still loading. */
const pending = (loading: boolean, value: number | null | undefined, lang: string) =>
  loading || value === null || value === undefined ? '—' : value.toLocaleString(lang)

/**
 * The platforms CheevoVault can track, side by side: who you are on
 * each one, the five numbers worth knowing at a glance, and the button that
 * connects or disconnects it.
 */
export default function UserPlatforms() {
  const { data: session, update } = useSession()
  const { T, lang } = useLanguage()
  const { all, inProgress } = useGamesData()
  const { rank, isLoading: rankLoading } = useUserRank()
  const { awards, isLoading: awardsLoading } = useUserAwards()
  const [raModalOpen, setRaModalOpen] = useState(false)
  const xboxEnabled = useXboxEnabled()

  const raUser = session?.user?.raUser as RetroAchievementsUserProfile | null | undefined
  const raConnected = Boolean(session?.user?.rausername)


  const raStats: PlatformStat[] = [
    {
      label: T.userStats.globalRank,
      value: rank?.Rank ? `#${rank.Rank.toLocaleString(lang)}` : '—',
      loading: rankLoading,
    },
    {
      label: T.profileStats.hardcorePoints,
      value: (raUser?.TotalPoints ?? 0).toLocaleString(lang),
      accent: 'text-warning',
    },
    { label: T.userStats.masteries, value: pending(awardsLoading, awards?.MasteryAwardsCount, lang), accent: 'text-success' },
    { label: T.userStats.games, value: all.length.toLocaleString(lang) },
    { label: T.userStats.inProgress, value: inProgress.length.toLocaleString(lang) },
  ]


  return (
    // Xbox is a fourth card, only for who may use it (an admin, for now): three columns otherwise.
    <div className={`grid grid-cols-1 gap-4 ${xboxEnabled ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'}`}>
      <UserPlatformCard
        name="RetroAchievements"
        source="ra"
        href={raUser?.User ? `https://retroachievements.org/user/${encodeURIComponent(raUser.User)}` : undefined}
        logo={<RaLogo height={18} />}
        bigLogo={<RaLogo height={40} />}
        gradient="from-[#2a80c7] via-[#2a80c7]/40 to-[#e5b53f]"
        connected={raConnected}
        hint={T.userPage.raConnectHint}
        identity={
          raUser?.User ? (
            <div className="flex items-center gap-3 min-w-0">
              {raUser.UserPic && (
                <Image
                  src={`https://retroachievements.org${raUser.UserPic}`}
                  alt=""
                  width={44}
                  height={44}
                  className="rounded-lg w-10 h-10 object-cover shrink-0"
                  unoptimized
                />
              )}
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-bold truncate">{raUser.User}</span>
                <span className="text-[0.6875rem] text-text-secondary truncate">{raUser.ULID}</span>
              </div>
            </div>
          ) : null
        }
        stats={raConnected ? raStats : []}
        action={
          raConnected ? (
            <button
              onClick={async () => {
                if (await unlinkRaUser(update)) notify.success(T.toast.raUnlinked)
                else notify.error(T.toast.unlinkFailed)
              }}
              className={DISCONNECT_CLASS}
            >
              {T.userConfig.signOutRA}
            </button>
          ) : (
            <button onClick={() => setRaModalOpen(true)} className={CONNECT_CLASS}>
              <RaLogo height={14} />
              {T.userData.signInRA}
            </button>
          )
        }
      />

      <UserSteamCard />

      <UserPsnCard />

      <UserXboxCard />

      <RaLoginModal isOpen={raModalOpen} setIsOpen={setRaModalOpen} />
    </div>
  )
}
