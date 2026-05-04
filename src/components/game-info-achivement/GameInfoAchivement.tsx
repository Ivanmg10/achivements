import { RetroAchievement } from '@/types/types'
import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'

export default function GameInfoAchivement({
  achievement,
  numDistinctPlayers,
  onClick,
}: {
  achievement?: RetroAchievement
  numDistinctPlayers: number
  onClick?: () => void
}) {
  const { T } = useLanguage()

  if (!achievement) return null

  const TYPE_BADGES: Record<string, { label: string; className: string }> = {
    progression: { label: T.achievement.progression, className: 'bg-blue-900/60 text-blue-300' },
    win_condition: { label: T.achievement.winCondition, className: 'bg-yellow-900/60 text-yellow-300' },
    missable: { label: T.achievement.missable, className: 'bg-red-900/60 text-red-300' },
  }

  const earned = !!achievement.DateEarned
  const earnedHardcore = !!achievement.DateEarnedHardcore
  const rarityPct =
    numDistinctPlayers > 0
      ? ((achievement.NumAwarded / numDistinctPlayers) * 100).toFixed(1)
      : null

  const typeBadge = achievement.Type ? TYPE_BADGES[achievement.Type] : null
  const fmt = (n: number) => n.toLocaleString()

  const earnedDate = achievement.DateEarned
    ? new Date(achievement.DateEarned).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <tr
      onClick={onClick}
      className={`border-b border-bg-header/60 cursor-pointer hover:bg-bg-header/30 transition-colors duration-150 ${
        earned ? '' : 'opacity-40'
      }`}
    >
      <td className="px-3 py-2 w-24 align-middle text-center">
        {achievement.BadgeName && (
          <Image
            src={`https://media.retroachievements.org/Badge/${achievement.BadgeName}.png`}
            alt="achievement icon"
            width={80}
            height={80}
            className={`w-16 h-16 rounded-xl object-cover shrink-0 block mx-auto ${
              earnedHardcore ? 'ring-2 ring-yellow-400' : ''
            } ${earned ? '' : 'grayscale'}`}
          />
        )}
      </td>

      <td className="px-3 py-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-lg">{achievement.Title}</h3>
          {typeBadge && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${typeBadge.className}`}>
              {typeBadge.label}
            </span>
          )}
        </div>
        <p className="text-sm text-text-secondary">{achievement.Description}</p>
        {earnedDate && (
          <p className="text-xs text-text-secondary/60 mt-0.5">
            {T.achievement.earnedOn} {earnedDate}
          </p>
        )}
      </td>

      <td className="px-3 py-2 w-48 text-center align-middle tabular-nums hidden sm:table-cell">
        <p className="text-sm leading-snug">
          <span className="text-text-main font-medium">{fmt(achievement.NumAwarded)}</span>{' '}
          <span className="text-text-secondary/70">{T.achievement.players}</span>
        </p>
      </td>

      <td className="px-3 py-2 w-48 text-center align-middle tabular-nums hidden sm:table-cell">
        <p className="text-sm leading-snug">
          <span className="text-text-main font-medium">{fmt(achievement.NumAwardedHardcore)}</span>{' '}
          <span className="text-text-secondary/70">{T.achievement.inHardcore}</span>
        </p>
      </td>

      <td className="px-3 py-2 w-36 text-center align-middle tabular-nums hidden sm:table-cell">
        {rarityPct !== null ? (
          <p className="text-sm leading-snug">
            <span className="text-text-main font-medium">{rarityPct}</span>
            <span className="text-text-secondary/70">{T.achievement.haveIt}</span>
          </p>
        ) : (
          <span className="text-sm text-text-secondary">—</span>
        )}
      </td>

      <td className="px-3 py-2 w-40 text-center align-middle hidden sm:table-cell">
        {earned ? (
          <span className="text-green-400 text-base">✓</span>
        ) : (
          <span className="text-text-secondary/40 text-sm">—</span>
        )}
      </td>

      <td className="px-3 py-2 w-28 text-center align-middle tabular-nums">
        <p className="text-sm text-text-main font-medium">{achievement.Points}</p>
        <p className="text-xs text-text-secondary/60">pts</p>
      </td>
    </tr>
  )
}
