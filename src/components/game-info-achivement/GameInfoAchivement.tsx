import { IconStar, IconStarFilled } from '@tabler/icons-react'
import { RetroAchievement } from '@/types/types'
import { FadeImage } from '@/components/ui/FadeImage'
import { useLanguage } from '@/context/LanguageContext'

/**
 * One achievement as a row of the RA game table. The title is the button that
 * opens the achievement (so the keyboard reaches it), stretched over the whole
 * row for the pointer; the favourite star sits above that.
 *
 * Unearned ones are told apart by a grey badge and the dash under "Earned",
 * with their text kept at full contrast.
 */
export default function GameInfoAchivement({
  achievement,
  numDistinctPlayers,
  isFavorited = false,
  onToggleFavorite,
  onClick,
}: {
  achievement?: RetroAchievement
  numDistinctPlayers: number
  isFavorited?: boolean
  onToggleFavorite?: (achievement: RetroAchievement) => void
  onClick?: () => void
}) {
  const { T, lang } = useLanguage()

  const TYPE_BADGES: Record<string, { label: string; className: string }> = {
    progression: { label: T.achievement.progression, className: 'bg-info/20 text-info' },
    win_condition: { label: T.achievement.winCondition, className: 'bg-warning/20 text-warning' },
    missable: { label: T.achievement.missable, className: 'bg-danger/20 text-danger' },
  }

  if (!achievement) return null

  const earned = !!achievement.DateEarned
  const earnedHardcore = !!achievement.DateEarnedHardcore
  const rarityPct =
    numDistinctPlayers > 0
      ? ((achievement.NumAwarded / numDistinctPlayers) * 100).toFixed(1)
      : null

  const typeBadge = achievement.Type ? TYPE_BADGES[achievement.Type] : null
  const fmt = (n: number) => n.toLocaleString(lang)

  const earnedDate = achievement.DateEarned
    ? new Date(achievement.DateEarned).toLocaleString(lang, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <tr
      className={`relative group border-b border-bg-header/60 hover:bg-bg-header/30 transition-colors duration-150 ${
        isFavorited ? 'bg-warning/10' : ''
      }`}
    >
      <td className="px-3 py-2 w-24 align-middle text-center">
        {achievement.BadgeName && (
          <FadeImage
            src={`https://media.retroachievements.org/Badge/${achievement.BadgeName}.png`}
            alt=""
            width={80}
            height={80}
            className={`w-16 h-16 rounded-xl mx-auto ${earnedHardcore ? 'ring-2 ring-warning' : ''}`}
            imgClassName={`w-full h-full object-cover ${earned ? '' : 'grayscale opacity-60'}`}
          />
        )}
      </td>

      <td className="px-3 py-2">
        <div className="flex items-center gap-2 flex-wrap">
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(achievement)}
              aria-label={isFavorited ? T.favorites.removeFavorite : T.favorites.addFavorite}
              aria-pressed={isFavorited}
              className={`relative z-10 shrink-0 rounded transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
                isFavorited ? 'text-warning hover:text-warning/80' : 'text-text-secondary/50 hover:text-warning'
              }`}
            >
              {isFavorited ? <IconStarFilled className="w-4 h-4" aria-hidden="true" /> : <IconStar className="w-4 h-4" aria-hidden="true" />}
            </button>
          )}
          <h3 className={`text-lg ${earned ? '' : 'text-text-secondary'}`}>
            <button
              onClick={onClick}
              className="text-left rounded cursor-pointer before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              {achievement.Title}
            </button>
          </h3>
          {typeBadge && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${typeBadge.className}`}>
              {typeBadge.label}
            </span>
          )}
        </div>
        <p className="text-sm text-text-secondary">{achievement.Description}</p>
        {earnedDate && (
          <p className="text-xs text-text-secondary mt-0.5">
            {T.achievement.earnedOn} {earnedDate}
          </p>
        )}
        {achievement.Author && (
          <p className="text-xs text-text-secondary/70 mt-0.5">
            {T.achievement.by} {achievement.Author}
          </p>
        )}
      </td>

      <td className="px-3 py-2 w-48 text-center align-middle tabular-nums hidden sm:table-cell">
        <p className="text-sm leading-snug">
          <span className="text-text-main font-medium">{fmt(achievement.NumAwarded)}</span>{' '}
          <span className="text-text-secondary">{T.achievement.players}</span>
        </p>
      </td>

      <td className="px-3 py-2 w-48 text-center align-middle tabular-nums hidden sm:table-cell">
        <p className="text-sm leading-snug">
          <span className="text-text-main font-medium">{fmt(achievement.NumAwardedHardcore)}</span>{' '}
          <span className="text-text-secondary">{T.achievement.inHardcore}</span>
        </p>
      </td>

      <td className="px-3 py-2 w-36 text-center align-middle tabular-nums hidden sm:table-cell">
        {rarityPct !== null ? (
          <p className="text-sm leading-snug">
            <span className="text-text-main font-medium">{rarityPct}</span>
            <span className="text-text-secondary">{T.achievement.haveIt}</span>
          </p>
        ) : (
          <span className="text-sm text-text-secondary">—</span>
        )}
      </td>

      <td className="px-3 py-2 w-40 text-center align-middle hidden sm:table-cell">
        {earned ? (
          <span className="text-success text-base">✓</span>
        ) : (
          <span className="text-text-secondary text-sm">—</span>
        )}
      </td>

      <td className="px-3 py-2 w-28 text-center align-middle tabular-nums">
        <p className="text-sm text-text-main font-medium">{achievement.Points}</p>
        <p className="text-xs text-text-secondary">pts</p>
      </td>
    </tr>
  )
}
