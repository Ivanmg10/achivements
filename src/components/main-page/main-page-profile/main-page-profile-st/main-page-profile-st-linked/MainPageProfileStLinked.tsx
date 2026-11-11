'use client'

import SteamLogo from '@/components/steam-logo/SteamLogo'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useSteamRecentAchievements } from '@/hooks/useSteamRecentAchievements'
import { useSubject } from '@/context/SubjectContext'
import { codeToFlag, findCountry } from '@/utils/countries'
import MainPageProfileLinked from '../../main-page-profile-linked/MainPageProfileLinked'
import MainPageProfileStStats from '../main-page-profile-st-stats/MainPageProfileStStats'
import MainPageProfileStGame from '../main-page-profile-st-game/MainPageProfileStGame'
import MainPageProfileStAchievements from '../main-page-profile-st-achievements/MainPageProfileStAchievements'
import MainPageProfileGameSkeleton from '../../main-page-profile-game-skeleton/MainPageProfileGameSkeleton'
import type { SteamProfile } from '@/types/steam'

/**
 * A linked Steam profile: header (avatar, name, level, status, member since, link out), four stats,
 * the current or last game with its progress, and recent unlocks. Library figures come from the
 * shared context — no extra calls.
 */
export default function MainPageProfileStLinked({
  profile,
  isLoading,
  error,
  onRetry,
}: {
  profile: SteamProfile | null
  isLoading: boolean
  error: string | null
  onRetry: () => void
}) {
  const { T } = useLanguage()
  const own = useSubject() === null
  const { library, libraryLoading, recent, refetch } = useSteamGamesData()
  const recentAchievements = useSteamRecentAchievements()

  if (error || !profile) {
    return (
      <MainPageProfileLinked
        isLoading={isLoading}
        failure={{ logo: <SteamLogo size={16} aria-hidden="true" />, title: T.steam.profileError, detail: T.steam.privateProfileHint, retryLabel: T.steam.retry, onRetry }}
      />
    )
  }

  // The game running right now if Steam says so, otherwise the last one played.
  const runningId = profile.gameid ? Number(profile.gameid) : null
  const running = runningId !== null ? [...recent, ...library].find((g) => g.id === runningId) : undefined
  const featured = running ?? recent[0]

  const memberYear = profile.timecreated ? new Date(profile.timecreated * 1000).getFullYear() : null
  const country = profile.loccountrycode ? findCountry(profile.loccountrycode) : undefined

  let status: { text: string; dot: string } | null
  if (profile.gameextrainfo) status = { text: `${T.steam.nowPlaying}: ${profile.gameextrainfo}`, dot: 'bg-steam-perfect' }
  else if ((profile.personastate ?? 0) > 0) status = { text: T.steam.online, dot: 'bg-steam' }
  // On your own card "Offline" while you use the site says nothing true (#128): only someone else's says it.
  else status = own ? null : { text: T.steam.offline, dot: 'bg-offline' }

  return (
    <MainPageProfileLinked
      isLoading={isLoading}
      onRefresh={() => {
        onRetry()
        recentAchievements.retry()
        refetch()
      }}
      card={{
        avatarSrc: profile.avatarfull || null,
        avatarFallback: <span className="w-full h-full bg-steam-dark flex items-center justify-center"><SteamLogo size={32} className="text-steam" /></span>,
        ring: 'var(--color-steam)',
        name: profile.personaname,
        link: profile.profileurl ? { href: profile.profileurl, label: T.steam.viewOnSteam, ringClass: 'focus:ring-steam' } : null,
        stats: <MainPageProfileStStats library={library} isLoading={libraryLoading} />,
        children: (
          <>
            <div className="flex items-center gap-2 flex-wrap text-[0.8125rem] text-text-secondary">
              {profile.level !== null && (
                <span className="inline-flex items-center gap-1">
                  {T.steam.level}
                  <span className="inline-flex items-center justify-center min-w-6 h-6 px-1 rounded-full border-2 border-steam text-text-main font-bold tabular-nums">
                    {profile.level}
                  </span>
                </span>
              )}
              {status && (
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <span aria-hidden="true" className={`inline-block w-2 h-2 rounded-full shrink-0 ${status.dot}`} />
                  <span className="truncate">{status.text}</span>
                </span>
              )}
            </div>
            {(memberYear || country) && (
              <p className="text-[0.8125rem] text-text-secondary">
                {memberYear && `${T.profileRa.memberSince} ${memberYear}`}
                {memberYear && country && ' · '}
                {country && (
                  <span>
                    <span aria-hidden="true">{codeToFlag(country.code)} </span>
                    {country.name}
                  </span>
                )}
              </p>
            )}
          </>
        ),
      }}
      game={featured ? <MainPageProfileStGame game={featured} playingNow={featured === running} /> : libraryLoading && <MainPageProfileGameSkeleton />}
      recent={<MainPageProfileStAchievements achievements={recentAchievements.achievements} isLoading={recentAchievements.isLoading} error={recentAchievements.error} onRetry={recentAchievements.retry} />}
    />
  )
}
