'use client'

import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useSteamLink } from '@/hooks/useSteamLink'
import { useSteamProfile } from '@/hooks/useSteamProfile'
import { notify } from '@/lib/notify'
import { formatPlaytime, summarizeSteamLibrary } from '@/utils/steamFeed'
import UserPlatformCard, { DISCONNECT_CLASS, PlatformStat } from '@/components/user-page/user-platform-card/UserPlatformCard'
import UserSteamCardForm from './user-steam-card-form/UserSteamCardForm'
import SteamLogo from '@/components/steam-logo/SteamLogo'

/** A dash rather than a zero while the numbers are still loading. */
const pending = (loading: boolean, value: number | null | undefined) =>
  loading || value === null || value === undefined ? '—' : value.toLocaleString()

/**
 * Steam on the account page and in onboarding. Linked by typing a custom URL
 * name, a profile link or a SteamID64 — like PSN, no Steam sign-in: the
 * profile only has to exist and be public.
 */
export default function UserSteamCard() {
  const { T, lang } = useLanguage()
  const { steamId, steamUsername, isLinked, link, isLinking, error, unlink, isUnlinking } = useSteamLink()
  const { library, libraryLoading } = useSteamGamesData()
  const { profile } = useSteamProfile()
  const steam = summarizeSteamLibrary(library)

  const stats: PlatformStat[] = [
    { label: T.userStats.games, value: pending(libraryLoading, steam.totalGames) },
    { label: T.steam.perfect, value: pending(libraryLoading, steam.perfect), accent: 'text-[#a4d007]' },
    { label: T.steam.achievements, value: pending(libraryLoading, steam.unlocked), accent: 'text-[#66c0f4]' },
    { label: T.userStats.inProgress, value: pending(libraryLoading, steam.playing), accent: 'text-amber-400' },
    {
      label: T.steam.playtime,
      value: libraryLoading ? '—' : formatPlaytime(steam.totalMinutes, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang),
    },
  ]

  const handleLink = async (query: string) => {
    if (await link(query)) notify.success(T.toast.steamLinked)
  }

  const handleUnlink = async () => {
    if (await unlink()) notify.success(T.toast.steamUnlinked)
    else notify.error(T.toast.unlinkFailed)
  }

  return (
    <UserPlatformCard
      name="Steam"
      href={steamId ? `https://steamcommunity.com/profiles/${encodeURIComponent(steamId)}` : undefined}
      logo={<SteamLogo size={18} className="text-[#66c0f4]" aria-hidden="true" />}
      bigLogo={<SteamLogo size={40} className="text-[#66c0f4]" aria-hidden="true" />}
      gradient="from-[#66c0f4] via-[#2a475e] to-[#1b2838]"
      connected={isLinked}
      hint={T.userPage.steamConnectHint}
      identity={
        isLinked ? (
          <div className="flex items-center gap-3 min-w-0">
            {profile?.avatarfull ? (
              <Image src={profile.avatarfull} alt="" width={44} height={44} className="rounded-lg w-11 h-11 object-cover shrink-0" unoptimized />
            ) : (
              <SteamLogo size={40} className="shrink-0 text-text-secondary" aria-hidden="true" />
            )}
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-bold truncate">{profile?.personaname || steamUsername || '—'}</span>
              <span className="text-xs text-text-secondary font-mono truncate">{steamId}</span>
            </div>
          </div>
        ) : null
      }
      stats={isLinked ? stats : []}
      action={
        isLinked ? (
          <button onClick={handleUnlink} disabled={isUnlinking} className={DISCONNECT_CLASS}>
            {isUnlinking ? T.userData.steamDisconnecting : T.userData.steamDisconnect}
          </button>
        ) : (
          <UserSteamCardForm onSubmit={handleLink} isLinking={isLinking} error={error} />
        )
      }
    />
  )
}
