'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useSteamLink } from '@/hooks/useSteamLink'
import { useSteamProfile } from '@/hooks/useSteamProfile'
import { formatPlaytime, summarizeSteamLibrary } from '@/utils/steamFeed'
import UserPlatformCard, { platformStat, PlatformStat } from '@/components/user-page/user-platform-card/UserPlatformCard'
import UserSteamCardLink from './user-steam-card-link/UserSteamCardLink'
import SteamLogo from '@/components/steam-logo/SteamLogo'

/**
 * Steam on the account page and in onboarding. Linked through Steam's own
 * sign-in, which proves the account is the user's (and lets it sign in with Steam).
 */
export default function UserSteamCard() {
  const { T, lang } = useLanguage()
  const { steamId, steamUsername, isLinked, linkHref, unlink } = useSteamLink()
  const { library, libraryLoading } = useSteamGamesData()
  const { profile } = useSteamProfile()
  const steam = summarizeSteamLibrary(library)

  const loading = libraryLoading
  const stats: PlatformStat[] = [
    platformStat(T.userStats.games, steam.totalGames, { lang, loading }),
    platformStat(T.steam.perfect, steam.perfect, { lang, loading, tone: 'success' }),
    platformStat(T.steam.achievements, steam.unlocked, { lang, loading }),
    platformStat(T.userStats.inProgress, steam.playing, { lang, loading }),
    platformStat(T.steam.playtime, formatPlaytime(steam.totalMinutes, T.steam, lang), { lang, loading }),
  ]

  return (
    <UserPlatformCard
      name="Steam"
      source="steam"
      href={steamId ? `https://steamcommunity.com/profiles/${encodeURIComponent(steamId)}` : undefined}
      logo={<SteamLogo size={18} className="text-steam" aria-hidden="true" />}
      bigLogo={<SteamLogo size={40} className="text-steam" aria-hidden="true" />}
      gradient="from-steam via-steam-slate to-steam-dark"
      connected={isLinked}
      hint={T.userPage.steamConnectHint}
      identity={{
        avatar: profile?.avatarfull,
        fallback: <SteamLogo size={40} className="shrink-0 text-text-secondary" aria-hidden="true" />,
        name: profile?.personaname || steamUsername || '—',
        id: steamId,
      }}
      stats={isLinked ? stats : []}
      disconnect={{
        label: T.userData.steamDisconnect,
        busyLabel: T.userData.steamDisconnecting,
        run: unlink,
        done: T.toast.steamUnlinked,
      }}
      action={<UserSteamCardLink href={linkHref} />}
    />
  )
}
