'use client'

import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useSteamLink } from '@/hooks/useSteamLink'
import { useSteamProfile } from '@/hooks/useSteamProfile'
import { notify } from '@/lib/notify'
import { formatPlaytime, summarizeSteamLibrary } from '@/utils/steamFeed'
import UserPlatformCard, { DISCONNECT_CLASS, PlatformStat } from '@/components/user-page/user-platform-card/UserPlatformCard'
import UserSteamCardLink from './user-steam-card-link/UserSteamCardLink'
import SteamLogo from '@/components/steam-logo/SteamLogo'

/** A dash rather than a zero while the numbers are still loading. */
const pending = (loading: boolean, value: number | null | undefined, lang: string) =>
  loading || value === null || value === undefined ? '—' : value.toLocaleString(lang)

/**
 * Steam on the account page and in onboarding. Linked through Steam's own
 * sign-in, which proves the account is the user's (and lets it sign in with Steam).
 */
export default function UserSteamCard() {
  const { T, lang } = useLanguage()
  const { steamId, steamUsername, isLinked, linkHref, unlink, isUnlinking } = useSteamLink()
  const { library, libraryLoading } = useSteamGamesData()
  const { profile } = useSteamProfile()
  const steam = summarizeSteamLibrary(library)

  const stats: PlatformStat[] = [
    { label: T.userStats.games, value: pending(libraryLoading, steam.totalGames, lang) },
    { label: T.steam.perfect, value: pending(libraryLoading, steam.perfect, lang), accent: 'text-success' },
    { label: T.steam.achievements, value: pending(libraryLoading, steam.unlocked, lang) },
    { label: T.userStats.inProgress, value: pending(libraryLoading, steam.playing, lang) },
    {
      label: T.steam.playtime,
      value: libraryLoading ? '—' : formatPlaytime(steam.totalMinutes, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang),
    },
  ]

  const handleUnlink = async () => {
    if (await unlink()) notify.success(T.toast.steamUnlinked)
    else notify.error(T.toast.unlinkFailed)
  }

  return (
    <UserPlatformCard
      name="Steam"
      source="steam"
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
              <Image src={profile.avatarfull} alt="" width={44} height={44} className="rounded-lg w-10 h-10 object-cover shrink-0" unoptimized />
            ) : (
              <SteamLogo size={40} className="shrink-0 text-text-secondary" aria-hidden="true" />
            )}
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-bold truncate">{profile?.personaname || steamUsername || '—'}</span>
              <span className="text-[0.6875rem] text-text-secondary truncate">{steamId}</span>
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
          <UserSteamCardLink href={linkHref} />
        )
      }
    />
  )
}
