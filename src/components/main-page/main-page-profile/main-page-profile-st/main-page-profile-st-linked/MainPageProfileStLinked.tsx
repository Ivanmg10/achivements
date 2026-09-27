'use client'

import Image from 'next/image'
import { IconExternalLink } from '@tabler/icons-react'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useSteamRecentAchievements } from '@/hooks/useSteamRecentAchievements'
import { codeToFlag, findCountry } from '@/utils/countries'
import MainPageProfileStStats from '../main-page-profile-st-stats/MainPageProfileStStats'
import MainPageProfileStGame from '../main-page-profile-st-game/MainPageProfileStGame'
import MainPageProfileStAchievements from '../main-page-profile-st-achievements/MainPageProfileStAchievements'
import type { SteamProfile } from '@/types/steam'

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
  const { library, libraryLoading, recent } = useSteamGamesData()
  const recentAchievements = useSteamRecentAchievements()

  if (isLoading) {
    return <div aria-busy="true" className="w-full h-full min-h-32 bg-bg-card rounded-xl animate-pulse" />
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-start gap-2 p-3 bg-bg-card rounded-xl w-full">
        <p role="alert" className="text-sm text-red-400">
          {T.steam.profileError}
        </p>
        <p className="text-xs text-text-secondary">{T.steam.privateProfileHint}</p>
        <button
          onClick={onRetry}
          className="text-xs bg-bg-main px-3 py-1 rounded-full hover:bg-white/10 transition-colors"
        >
          {T.steam.retry}
        </button>
      </div>
    )
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
    <div className="relative flex flex-col gap-3 p-3 bg-bg-card rounded-xl w-full h-full">
      {profile.profileurl && (
        <a
          href={profile.profileurl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-text-secondary hover:text-text-main text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#66c0f4]"
        >
          <IconExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          {T.steam.viewOnSteam}
        </a>
      )}

      <div className="flex gap-3 items-center pr-28">
        {profile.avatarfull ? (
          <Image
            src={profile.avatarfull}
            alt=""
            width={90}
            height={90}
            className="m-1 rounded-lg ring-2 ring-[#66c0f4] shrink-0 w-15 h-15 lg:w-22.5 lg:h-22.5"
            unoptimized
          />
        ) : (
          <div
            aria-hidden="true"
            className="m-1 rounded-lg bg-[#1b2838] shrink-0 w-15 h-15 lg:w-22.5 lg:h-22.5 flex items-center justify-center"
          >
            <SteamLogo size={32} className="text-[#66c0f4]" />
          </div>
        )}
        <div className="flex flex-col gap-1 min-w-0 w-full">
          <p className="text-xl lg:text-2xl font-bold leading-tight truncate">{profile.personaname}</p>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {profile.level !== null && (
              <span className="inline-flex items-center gap-1 text-text-secondary">
                {T.steam.level}
                <span className="inline-flex items-center justify-center min-w-6 h-6 px-1 rounded-full border-2 border-[#66c0f4] text-text-main font-bold tabular-nums">
                  {profile.level}
                </span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-text-secondary min-w-0">
              <span aria-hidden="true" className={`inline-block w-2 h-2 rounded-full shrink-0 ${status.dot}`} />
              <span className="truncate">{status.text}</span>
            </span>
          </div>
          {(memberYear || country) && (
            <p className="text-xs text-gray-500">
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
        </div>
      </div>

      <MainPageProfileStStats library={library} isLoading={libraryLoading} />

      {featured && <MainPageProfileStGame game={featured} playingNow={featured === running} />}

      <MainPageProfileStAchievements
        achievements={recentAchievements.achievements}
        isLoading={recentAchievements.isLoading}
        error={recentAchievements.error}
        onRetry={recentAchievements.retry}
      />
    </div>
  )
}
