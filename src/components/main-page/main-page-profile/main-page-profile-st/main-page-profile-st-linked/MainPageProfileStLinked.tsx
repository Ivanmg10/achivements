'use client'

import SteamLogo from '@/components/steam-logo/SteamLogo'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useSubject } from '@/context/SubjectContext'
import { useSteamRecentAchievements } from '@/hooks/useSteamRecentAchievements'
import { codeToFlag, findCountry } from '@/utils/countries'
import MainPageProfileActions from '../../main-page-profile-actions/MainPageProfileActions'
import MainPageProfileError from '../../main-page-profile-error/MainPageProfileError'
import MainPageProfileStStats from '../main-page-profile-st-stats/MainPageProfileStStats'
import MainPageProfileStGame from '../main-page-profile-st-game/MainPageProfileStGame'
import MainPageProfileStAchievements from '../main-page-profile-st-achievements/MainPageProfileStAchievements'
import MainPageProfileSkeleton from '../../main-page-profile-skeleton/MainPageProfileSkeleton'
import MainPageProfileGameSkeleton from '../../main-page-profile-game-skeleton/MainPageProfileGameSkeleton'
import type { SteamProfile } from '@/types/steam'
import MainPageProfileCard from '../../main-page-profile-card/MainPageProfileCard'

/**
 * A linked Steam profile, built like MainPageProfileRa block for block:
 * header (avatar, name, level, status, member since, link out), four stats,
 * the current or last game with its progress, and recent unlocks.
 *
 * Library figures come from the shared context — no extra calls.
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
  const { library, libraryLoading, recent, refetch } = useSteamGamesData()
  const recentAchievements = useSteamRecentAchievements()
  const subject = useSubject()

  if (isLoading) {
    return <MainPageProfileSkeleton label={T.cards.loading} />
  }

  if (error || !profile) {
    return <MainPageProfileError logo={<SteamLogo size={16} aria-hidden="true" />} title={T.steam.profileError} detail={T.steam.privateProfileHint} retryLabel={T.steam.retry} onRetry={onRetry} />
  }

  // Someone else's page has nothing of the viewer's to refresh.
  const refresh = subject
    ? undefined
    : () => {
        onRetry()
        recentAchievements.retry()
        refetch()
      }

  // The game running right now if Steam says so, otherwise the last one played.
  const runningId = profile.gameid ? Number(profile.gameid) : null
  const running = runningId !== null ? [...recent, ...library].find((g) => g.id === runningId) : undefined
  const featured = running ?? recent[0]

  const memberYear = profile.timecreated ? new Date(profile.timecreated * 1000).getFullYear() : null
  const country = profile.loccountrycode ? findCountry(profile.loccountrycode) : undefined

  let status: { text: string; dot: string }
  if (profile.gameextrainfo) status = { text: `${T.steam.nowPlaying}: ${profile.gameextrainfo}`, dot: 'bg-[#a4d007]' }
  else if ((profile.personastate ?? 0) > 0) status = { text: T.steam.online, dot: 'bg-[#66c0f4]' }
  else status = { text: T.steam.offline, dot: 'bg-gray-500' }

  return (
    // Fills the column like the RA card, so switching tabs does not resize it.
    <div className="flex flex-col gap-3.5 w-full h-full">
      <MainPageProfileCard
        avatarSrc={profile.avatarfull || null}
        avatarFallback={<span className="w-full h-full bg-[#1b2838] flex items-center justify-center"><SteamLogo size={32} className="text-[#66c0f4]" /></span>}
        ring="#66c0f4"
        name={profile.personaname}
        actions={
          profile.profileurl && (
            <MainPageProfileActions href={profile.profileurl} linkLabel={T.steam.viewOnSteam} ringClass="focus:ring-[#66c0f4]" onRefresh={refresh} />
          )
        }
        stats={<MainPageProfileStStats library={library} isLoading={libraryLoading} />}
      >
        <div className="flex items-center gap-2 flex-wrap text-[0.8125rem] text-text-secondary">
          {profile.level !== null && (
            <span className="inline-flex items-center gap-1">
              {T.steam.level}
              <span className="inline-flex items-center justify-center min-w-6 h-6 px-1 rounded-full border-2 border-[#66c0f4] text-text-main font-bold tabular-nums">
                {profile.level}
              </span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <span aria-hidden="true" className={`inline-block w-2 h-2 rounded-full shrink-0 ${status.dot}`} />
            <span className="truncate">{status.text}</span>
          </span>
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
      </MainPageProfileCard>

      {featured ? (
        <MainPageProfileStGame game={featured} playingNow={featured === running} />
      ) : (
        libraryLoading && <MainPageProfileGameSkeleton />
      )}

      <MainPageProfileStAchievements
        achievements={recentAchievements.achievements}
        isLoading={recentAchievements.isLoading}
        error={recentAchievements.error}
        onRetry={recentAchievements.retry}
      />
    </div>
  )
}
