'use client'

import Image from 'next/image'
import { IconLock, IconCheck } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamAchievements } from '@/hooks/useSteamAchievements'
import { formatDate } from '@/utils/utils'

const SKELETON_ROWS = 4

/**
 * A Steam game's achievements, fetched when this mounts — i.e. when the card
 * is expanded — not for every game in the list.
 *
 * Earned vs locked is carried by text and an icon as well as by Steam's own
 * colour/grey badge, so it does not rely on colour alone.
 */
export default function SteamGameItemAchievements({ appId }: { appId: number }) {
  const { T } = useLanguage()
  const { achievements, isLoading, error, retry } = useSteamAchievements(appId)

  if (isLoading) {
    return (
      <ul aria-busy="true" className="flex flex-col gap-2">
        {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
          <li key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </ul>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p role="alert" className="text-sm text-red-400">
          {T.steam.achievementsError}
        </p>
        <p className="text-xs text-text-secondary">{T.steam.privateProfileHint}</p>
        <button
          onClick={retry}
          className="text-xs bg-bg-card px-3 py-1 rounded-full hover:bg-white/10 transition-colors"
        >
          {T.steam.retry}
        </button>
      </div>
    )
  }

  if (achievements.length === 0) {
    return <p className="text-sm text-text-secondary">{T.steam.noAchievements}</p>
  }

  return (
    <ul className="flex flex-col gap-2">
      {achievements.map((a) => {
        const earned = a.dateEarned !== null
        // Steam hides the text of secret achievements until they are unlocked.
        const concealed = a._source === 'steam' && a.hidden && !earned
        return (
          <li key={String(a.id)} className="flex items-center gap-3 bg-white/5 rounded-lg p-2">
            {a.badgeUrl ? (
              <Image
                src={a.badgeUrl}
                alt=""
                width={40}
                height={40}
                className="w-10 h-10 rounded-md shrink-0"
                unoptimized
              />
            ) : (
              <div className="w-10 h-10 rounded-md bg-white/10 shrink-0" aria-hidden="true" />
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <span className={`text-sm font-semibold truncate ${earned ? '' : 'text-text-secondary'}`}>
                {concealed ? T.steam.hiddenAchievement : a.title}
              </span>
              <span className="text-xs text-text-secondary line-clamp-2">
                {concealed ? T.steam.hiddenAchievementDesc : a.description}
              </span>
            </div>
            <span className="flex items-center gap-1 text-[11px] shrink-0 text-text-secondary">
              {earned ? (
                <>
                  <IconCheck size={14} className="text-[#a4d007]" aria-hidden="true" />
                  <span>
                    {T.steam.earned}
                    {a.dateEarned && <span className="hidden sm:inline"> · {formatDate(a.dateEarned)}</span>}
                  </span>
                </>
              ) : (
                <>
                  <IconLock size={14} aria-hidden="true" />
                  <span>{T.steam.locked}</span>
                </>
              )}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
