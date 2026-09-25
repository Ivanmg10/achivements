'use client'

import { useSteamProfile } from '@/hooks/useSteamProfile'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { useLanguage } from '@/context/LanguageContext'
import { StatCard } from '@/components/ui/StatPill'
import { formatPlaytime, summarizeSteamLibrary } from '@/utils/steamFeed'

/**
 * The Steam side of the profile page, next to the RetroAchievements section:
 * library totals rolled up the same way the main page's Steam card does, plus
 * status (playing now / online / offline) from the live profile.
 *
 * Renders nothing without a linked Steam account — the page's own section
 * covers that case, this one only appears once there is something to show.
 */
export default function UserSteamStats() {
  const { profile, isLoading: profileLoading, error: profileError, retry } = useSteamProfile()
  const { isLinked, library, libraryLoading } = useSteamGamesData()
  const { T, lang } = useLanguage()

  if (!isLinked) return null

  const summary = summarizeSteamLibrary(library)

  let status: { text: string; dot: string } | null = null
  if (profile?.gameextrainfo) status = { text: `${T.steam.nowPlaying}: ${profile.gameextrainfo}`, dot: 'bg-[#a4d007]' }
  else if (profile && (profile.personastate ?? 0) > 0) status = { text: T.steam.online, dot: 'bg-[#66c0f4]' }
  else if (profile) status = { text: T.steam.offline, dot: 'bg-gray-500' }

  return (
    <div className="bg-bg-card rounded-3xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          {T.steam.gamesSection}
        </h2>
        {status && (
          <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
            <span aria-hidden="true" className={`inline-block w-2 h-2 rounded-full shrink-0 ${status.dot}`} />
            {status.text}
          </span>
        )}
      </div>

      {profileError ? (
        <div className="flex flex-col items-start gap-2">
          <p role="alert" className="text-sm text-red-400">
            {T.steam.profileError}
          </p>
          <button
            onClick={retry}
            className="text-xs bg-bg-main px-3 py-1 rounded-full hover:bg-white/10 transition-colors"
          >
            {T.steam.retry}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {profile?.level != null && (
            <StatCard label={T.steam.level} value={profileLoading ? '—' : profile.level} accent="text-[#66c0f4]" />
          )}
          <StatCard label={T.steam.statGames} value={libraryLoading ? '—' : summary.totalGames.toLocaleString(lang)} />
          <StatCard
            label={T.steam.statPerfect}
            value={libraryLoading ? '—' : summary.perfect.toLocaleString(lang)}
            accent="text-[#a4d007]"
          />
          <StatCard
            label={T.steam.statAchievements}
            value={libraryLoading ? '—' : summary.unlocked.toLocaleString(lang)}
            accent="text-yellow-400"
          />
          <StatCard
            label={T.cards.steamAvgCompletion}
            value={libraryLoading ? '—' : `${summary.avgCompletion}%`}
          />
          <StatCard
            label={T.steam.totalPlaytime}
            value={libraryLoading ? '—' : formatPlaytime(summary.totalMinutes, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang)}
          />
        </div>
      )}
    </div>
  )
}
