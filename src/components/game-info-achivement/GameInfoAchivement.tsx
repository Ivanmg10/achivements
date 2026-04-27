import { RetroAchievement } from '@/types/types'
import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'

export default function GameInfoAchivement({
  achievement,
  numDistinctPlayers,
}: {
  achievement?: RetroAchievement
  numDistinctPlayers: number
}) {
  const { T } = useLanguage()

  if (!achievement) return null

  const TYPE_BADGES: Record<string, { label: string; className: string }> = {
    progression: { label: T.achievement.progression, className: 'bg-blue-900/60 text-blue-300' },
    win_condition: { label: T.achievement.winCondition, className: 'bg-yellow-900/60 text-yellow-300' },
    missable: { label: T.achievement.missable, className: 'bg-red-900/60 text-red-300' },
  }

  const earned = !!achievement.DateEarned
  const rarityPct =
    numDistinctPlayers > 0
      ? ((achievement.NumAwarded / numDistinctPlayers) * 100).toFixed(1)
      : null
  const typeBadge = achievement.Type ? TYPE_BADGES[achievement.Type] : null

  return (
    <tr
      className={
        earned
          ? 'cursor-pointer hover:scale-[1.01] transition-transform duration-200'
          : 'opacity-40'
      }
    >
      <td className="p-2 w-20 align-middle">
        {achievement.BadgeName && (
          <Image
            src={`https://media.retroachievements.org/Badge/${achievement.BadgeName}.png`}
            alt="achievement icon"
            width={80}
            height={80}
            className={`w-16 h-16 rounded-xl object-cover shrink-0 ${earned ? '' : 'grayscale'}`}
          />
        )}
      </td>

      <td className="p-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-lg">{achievement.Title}</h3>
          {typeBadge && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${typeBadge.className}`}>
              {typeBadge.label}
            </span>
          )}
        </div>
        <p className="text-sm text-text-secondary">{achievement.Description}</p>
      </td>

      <td className="p-2 text-sm text-text-secondary w-56">
        <p>{achievement.NumAwarded} {T.achievement.players}</p>
        <p>{achievement.NumAwardedHardcore} {T.achievement.inHardcore}</p>
        {rarityPct !== null && (
          <p className="text-xs text-text-secondary/70">{rarityPct}{T.achievement.haveIt}</p>
        )}
      </td>

      <td className="p-2 text-xs text-text-secondary w-20">{achievement.Points} pts</td>

      <td className="p-2 text-xs text-text-secondary text-center w-20">
        {achievement.DateEarned
          ? new Date(achievement.DateEarned).toLocaleDateString()
          : '-'}
      </td>
    </tr>
  )
}
