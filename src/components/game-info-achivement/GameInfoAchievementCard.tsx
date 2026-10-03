'use client'

import { IconStar, IconStarFilled } from '@tabler/icons-react'
import { FadeImage } from '@/components/ui/FadeImage'
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

  // A div, not a button: the favourite star is a button of its own, and a
  // button inside a button is invalid HTML. The whole card is still the click
  // target, through a button stretched over it; the star sits above that.
  return (
    <div
      className={`relative w-full flex items-start gap-3 p-3 rounded-xl bg-bg-header/20 hover:bg-bg-header/50 transition-colors text-left ${
        isFavorited ? 'bg-warning/10' : ''
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={achievement.Title}
        className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      />
      {/* Badge */}
      <div className="relative shrink-0">
        {achievement.BadgeName && (
          <FadeImage
            src={`https://media.retroachievements.org/Badge/${achievement.BadgeName}.png`}
            alt=""
            width={56}
            height={56}
            className={`w-14 h-14 rounded-xl ${earnedHardcore ? 'ring-2 ring-warning' : ''}`}
            imgClassName={`w-full h-full object-cover ${earned ? '' : 'grayscale opacity-60'}`}
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
                aria-pressed={isFavorited}
                className={`relative z-10 shrink-0 transition-colors ${isFavorited ? 'text-warning' : 'text-text-secondary/50 hover:text-warning'}`}
              >
                {isFavorited ? <IconStarFilled className="w-3.5 h-3.5" aria-hidden="true" /> : <IconStar className="w-3.5 h-3.5" aria-hidden="true" />}
              </button>
            )}
            <span className={`font-medium text-sm leading-snug ${earned ? '' : 'text-text-secondary'}`}>{achievement.Title}</span>
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
    </div>
  )
}
