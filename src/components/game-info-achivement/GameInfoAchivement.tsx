import { RetroAchievement } from '@/types/types'
import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'
import { motion } from 'framer-motion'

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
  const { T } = useLanguage()

  const TYPE_BADGES: Record<string, { label: string; className: string }> = {
    progression: { label: T.achievement.progression, className: 'bg-blue-900/60 text-blue-300' },
    win_condition: { label: T.achievement.winCondition, className: 'bg-yellow-900/60 text-yellow-300' },
    missable: { label: T.achievement.missable, className: 'bg-red-900/60 text-red-300' },
  }

  if (!achievement) return null

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
    <motion.tr
      onClick={onClick}
      className={`group border-b border-bg-header/60 cursor-pointer hover:bg-bg-header/30 transition-colors duration-150 ${
        isFavorited ? 'bg-yellow-900/10' : ''
      }`}
      initial={{ opacity: 0, y: 4 }}
      whileInView={{ opacity: earned ? 1 : 0.4, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <td className="px-3 py-2 w-24 align-middle text-center">
        {achievement.BadgeName && (
          <Image
            src={`https://media.retroachievements.org/Badge/${achievement.BadgeName}.png`}
            alt="achievement icon"
            width={80}
            height={80}
            className={`w-16 h-16 rounded-xl object-cover block mx-auto ${
              earnedHardcore ? 'ring-2 ring-yellow-400' : ''
            } ${earned ? '' : 'grayscale'}`}
          />
        )}
      </td>

      <td className="px-3 py-2">
        <div className="flex items-center gap-2 flex-wrap">
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(achievement)
              }}
              aria-label={isFavorited ? T.favorites.removeFavorite : T.favorites.addFavorite}
              className={`shrink-0 transition-colors duration-150 ${
                isFavorited
                  ? 'text-yellow-400 hover:text-yellow-300'
                  : 'text-text-secondary/50 hover:text-yellow-400'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill={isFavorited ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={1.8}
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          )}
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

    </motion.tr>
  )
}
