'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { IconDeviceGamepad2 } from '@tabler/icons-react'
import UserPlatformCard, { PlatformStat } from '@/components/user-page/user-platform-card/UserPlatformCard'
import RaLoginModal from '@/components/ra-login-modal/RaLoginModal'
import RaLogo from '@/components/ra-logo/RaLogo'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import { useLanguage } from '@/context/LanguageContext'
import { useGamesData } from '@/context/GamesDataContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useSteamLink, STEAM_LINK_URL, SteamLinkStatus } from '@/hooks/useSteamLink'
import { useUserRank } from '@/hooks/useUserRank'
import { useUserAwards } from '@/hooks/useUserAwards'
import { formatPlaytime, summarizeSteamLibrary } from '@/utils/steamFeed'
import { unlinkRaUser } from '@/utils/apiCallsUtils'
import { RetroAchievementsUserProfile } from '@/types/types'

/** Only 'linked' is good news — the rest are warnings the user may need to act on. */
function isLinkError(status: SteamLinkStatus) {
  return status !== null && status !== 'linked'
}

const DISCONNECT_CLASS =
  'w-full py-2 rounded-xl bg-red-500/15 text-red-400 font-semibold text-sm hover:bg-red-500/25 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70'
const CONNECT_CLASS =
  'w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-accent text-bg-main font-semibold text-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'

/** A dash rather than a zero while the numbers are still loading. */
const pending = (loading: boolean, value: number | null | undefined) =>
  loading || value === null || value === undefined ? '—' : value.toLocaleString()

/**
 * The three platforms CheevoVault can track, side by side: who you are on
 * each one, the five numbers worth knowing at a glance, and the button that
 * connects or disconnects it.
 */
export default function UserPlatforms() {
  const { data: session, update } = useSession()
  const { T, lang } = useLanguage()
  const { steamId, steamUsername, isLinked: steamLinked, status, isUnlinking, disconnect } = useSteamLink()
  const { library, libraryLoading } = useSteamGamesData()
  const { all, inProgress } = useGamesData()
  const { rank, isLoading: rankLoading } = useUserRank()
  const { awards, isLoading: awardsLoading } = useUserAwards()
  const [raModalOpen, setRaModalOpen] = useState(false)

  const raUser = session?.user?.raUser as RetroAchievementsUserProfile | null | undefined
  const raConnected = Boolean(session?.user?.rausername)
  const steam = summarizeSteamLibrary(library)

  const STEAM_MESSAGES: Record<Exclude<SteamLinkStatus, null>, string> = {
    linked: T.userData.steamLinked,
    alreadyLinked: T.userData.steamAlreadyLinked,
    cancelled: T.userData.steamCancelled,
    failed: T.userData.steamFailed,
  }

  const raStats: PlatformStat[] = [
    {
      label: T.userStats.globalRank,
      value: rankLoading ? '…' : rank?.Rank ? `#${rank.Rank.toLocaleString()}` : '—',
      accent: 'text-accent',
    },
    {
      label: T.profileStats.hardcorePoints,
      value: (raUser?.TotalPoints ?? 0).toLocaleString(),
      accent: 'text-yellow-400',
    },
    { label: T.userStats.masteries, value: pending(awardsLoading, awards?.MasteryAwardsCount), accent: 'text-orange-400' },
    { label: T.userStats.games, value: all.length.toLocaleString() },
    { label: T.userStats.inProgress, value: inProgress.length.toLocaleString(), accent: 'text-amber-400' },
  ]

  const steamStats: PlatformStat[] = [
    { label: T.userStats.games, value: pending(libraryLoading, steam.totalGames) },
    { label: T.steam.perfect, value: pending(libraryLoading, steam.perfect), accent: 'text-[#a4d007]' },
    { label: T.steam.achievements, value: pending(libraryLoading, steam.unlocked), accent: 'text-[#66c0f4]' },
    { label: T.userStats.inProgress, value: pending(libraryLoading, steam.playing), accent: 'text-amber-400' },
    {
      label: T.steam.playtime,
      value: libraryLoading
        ? '—'
        : formatPlaytime(steam.totalMinutes, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang),
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UserPlatformCard
        name="RetroAchievements"
        logo={<RaLogo height={18} />}
        accent="bg-[#2a80c7]"
        connected={raConnected}
        identity={
          raUser?.User ? (
            <div className="flex items-center gap-3 min-w-0">
              {raUser.UserPic && (
                <Image
                  src={`https://retroachievements.org${raUser.UserPic}`}
                  alt=""
                  width={44}
                  height={44}
                  className="rounded-lg w-11 h-11 object-cover shrink-0"
                  unoptimized
                />
              )}
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-bold truncate">{raUser.User}</span>
                <span className="text-xs text-text-secondary font-mono truncate">{raUser.ULID}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-secondary">{T.userPage.raConnectHint}</p>
          )
        }
        stats={raConnected ? raStats : []}
        action={
          raConnected ? (
            <button onClick={() => unlinkRaUser(update)} className={DISCONNECT_CLASS}>
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

      <UserPlatformCard
        name="Steam"
        logo={<SteamLogo size={18} className="text-[#66c0f4]" aria-hidden="true" />}
        accent="bg-[#66c0f4]"
        connected={steamLinked}
        status={
          status && (
            <p
              role={isLinkError(status) ? 'alert' : 'status'}
              className={`text-xs ${isLinkError(status) ? 'text-red-400' : 'text-green-400'}`}
            >
              {STEAM_MESSAGES[status]}
            </p>
          )
        }
        identity={
          steamLinked ? (
            <div className="flex items-center gap-3 min-w-0">
              <SteamLogo size={40} className="shrink-0 text-text-secondary" aria-hidden="true" />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-bold truncate">{steamUsername || '—'}</span>
                <span className="text-xs text-text-secondary font-mono truncate">{steamId}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-secondary">{T.userPage.steamConnectHint}</p>
          )
        }
        stats={steamLinked ? steamStats : []}
        action={
          steamLinked ? (
            <button onClick={disconnect} disabled={isUnlinking} className={DISCONNECT_CLASS}>
              {isUnlinking ? T.userData.steamDisconnecting : T.userData.steamDisconnect}
            </button>
          ) : (
            <a href={STEAM_LINK_URL} className={CONNECT_CLASS}>
              <SteamLogo size={16} aria-hidden="true" />
              {T.userData.steamConnect}
            </a>
          )
        }
      />

      <UserPlatformCard
        name="PlayStation Network"
        logo={<IconDeviceGamepad2 size={18} className="text-[#0070d1]" aria-hidden="true" />}
        accent="bg-[#0070d1]"
        connected={false}
        soon
        identity={<p className="text-sm text-text-secondary">{T.userPage.psnHint}</p>}
        action={
          <button disabled className={`${CONNECT_CLASS} opacity-50 cursor-not-allowed`}>
            {T.userData.comingSoon}
          </button>
        }
      />

      <RaLoginModal isOpen={raModalOpen} setIsOpen={setRaModalOpen} />
    </div>
  )
}
