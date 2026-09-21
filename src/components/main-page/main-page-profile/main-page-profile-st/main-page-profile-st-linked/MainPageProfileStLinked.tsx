'use client'

import Image from 'next/image'
import { IconBrandSteam, IconExternalLink, IconPlayerPlayFilled } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { classifySteamGame, formatPlaytime, hasUnloadedProgress } from '@/utils/steamFeed'
import type { SteamPlayerSummary } from '@/types/steam'

/**
 * A linked Steam profile: avatar, persona, what they are playing right now,
 * and library totals. Totals come from the shared library, not extra calls.
 */
export default function MainPageProfileStLinked({
  profile,
  isLoading,
  error,
  onRetry,
}: {
  profile: SteamPlayerSummary | null
  isLoading: boolean
  error: string | null
  onRetry: () => void
}) {
  const { T, lang } = useLanguage()
  const { library, libraryLoading } = useSteamGamesData()

  if (isLoading) {
    return <div aria-busy="true" className="w-full h-32 bg-bg-card rounded-xl animate-pulse" />
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

  const totalMinutes = library.reduce((sum, g) => sum + g.playtimeForever, 0)
  const completed = library.filter((g) => classifySteamGame(g) === 'completed').length
  const units = { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }
  // Counts are still being filled in (or some could not be fetched), so the
  // completed total is a lower bound — say so rather than show a final-looking number.
  const completedSuffix = hasUnloadedProgress(library) ? '+' : ''

  const stats = [
    { label: T.steam.gamesOwned, value: library.length.toLocaleString(lang) },
    { label: T.steam.totalPlaytime, value: formatPlaytime(totalMinutes, units, lang) },
    { label: T.categories.completed, value: `${completed.toLocaleString(lang)}${completedSuffix}` },
  ]

  return (
    <div className="relative flex flex-col gap-3 p-3 bg-bg-card rounded-xl w-full">
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
            <IconBrandSteam size={32} className="text-[#66c0f4]" />
          </div>
        )}
        <div className="flex flex-col gap-1 min-w-0">
          <span className="flex items-center gap-1 text-xs text-text-secondary">
            <IconBrandSteam size={12} aria-hidden="true" />
            Steam
          </span>
          <p className="text-xl lg:text-2xl font-bold leading-tight truncate">{profile.personaname}</p>
          {profile.gameextrainfo && (
            <p className="flex items-center gap-1 text-xs text-[#a4d007] truncate">
              <IconPlayerPlayFilled size={10} aria-hidden="true" />
              <span className="truncate">
                {T.steam.nowPlaying}: {profile.gameextrainfo}
              </span>
            </p>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2" aria-busy={libraryLoading}>
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center bg-bg-main rounded-lg p-2 text-center">
            <dt className="text-[10px] uppercase tracking-wider text-text-secondary">{s.label}</dt>
            <dd className="text-sm font-bold">{libraryLoading ? '—' : s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
