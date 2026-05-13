'use client'

import Image from 'next/image'
import { RetroAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'

export default function GameInfoAchievementCard({
  achievement,
  numDistinctPlayers,
  isFavorited = false,
  onToggleFavorite,
  onClick,
}: {
  achievement: RetroAchievement
  numDistinctPlayers: number
  isFavorited?: boolean
  onToggleFavorite?: (a: RetroAchievement) => void
  onClick?: () => void
}) {
  const { T } = useLanguage()

  const TYPE_BADGES: Record<string, { label: string; className: string }> = {
    progression: { label: T.achievement.progression, className: 'bg-info/20 text-info' },
    win_condition: { label: T.achievement.winCondition, className: 'bg-warning/20 text-warning' },
    missable: { label: T.achievement.missable, className: 'bg-danger/20 text-danger' },
  }

  const earned = !!achievement.DateEarned
  const earnedHardcore = !!achievement.DateEarnedHardcore
  const rarityPct =
    numDistinctPlayers > 0
      ? ((achievement.NumAwarded / numDistinctPlayers) * 100).toFixed(1)
      : null
  const typeBadge = achievement.Type ? TYPE_BADGES[achievement.Type] : null

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-3 rounded-xl bg-bg-header/20 hover:bg-bg-header/50 transition-colors text-left ${
        isFavorited ? 'bg-warning/10' : ''
      } ${earned ? '' : 'opacity-50'}`}
    >
      {/* Badge */}
      <div className="relative shrink-0">
        {achievement.BadgeName && (
          <Image
            src={`https://media.retroachievements.org/Badge/${achievement.BadgeName}.png`}
            alt={achievement.Title}
            width={56}
            height={56}
            className={`w-14 h-14 rounded-xl object-cover ${earnedHardcore ? 'ring-2 ring-warning' : ''} ${earned ? '' : 'grayscale'}`}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            {onToggleFavorite && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(achievement) }}
                aria-label={isFavorited ? T.favorites.removeFavorite : T.favorites.addFavorite}
                className={`shrink-0 transition-colors ${isFavorited ? 'text-warning' : 'text-text-secondary/50 hover:text-warning'}`}
              >
                <svg viewBox="0 0 24 24" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </button>
            )}
            <span className="font-medium text-sm leading-snug">{achievement.Title}</span>
            {typeBadge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${typeBadge.className}`}>
                {typeBadge.label}
              </span>
            )}
          </div>
          {/* Points pill */}
          <span className="text-xs font-semibold text-text-main bg-bg-header px-2 py-0.5 rounded-full shrink-0">
            {achievement.Points}pt
          </span>
        </div>

        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{achievement.Description}</p>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-text-secondary/70 flex-wrap">
          {rarityPct !== null && (
            <span>{rarityPct}{T.achievement.haveIt}</span>
          )}
          <span>HC: {achievement.NumAwardedHardcore.toLocaleString()}</span>
          {earned && <span className="text-success font-medium">✓</span>}
        </div>

        {achievement.Author && (
          <p className="text-[10px] text-text-secondary/40 mt-1">
            {T.achievement.by} {achievement.Author}
          </p>
        )}
      </div>
    </button>
  )
}
