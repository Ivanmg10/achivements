import { IconCheck, IconStar, IconStarFilled } from '@tabler/icons-react'
import { RetroAchievement } from '@/types/types'
import { FadeImage } from '@/components/ui/FadeImage'
import { useLanguage } from '@/context/LanguageContext'
import RarityBadge from '@/components/ui/RarityBadge'
import { badgeClass, badgeImgClass, MID, NUM, raTypeTag, ROW, TD, TD_FIRST, TYPE_TAG } from '@/components/ui/dataTable'
import { raBadgeUrl } from '@/utils/raAssets'

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


  if (!achievement) return null

  const earned = !!achievement.DateEarned
  const earnedHardcore = !!achievement.DateEarnedHardcore
  const rarityPct = numDistinctPlayers > 0 ? (achievement.NumAwarded / numDistinctPlayers) * 100 : null
  const typeBadge = raTypeTag(achievement.Type, T.achievement)
  const fmt = (n: number) => n.toLocaleString(lang)
  const when = achievement.DateEarnedHardcore ?? achievement.DateEarned
  const earnedDate = when
    ? new Date(when).toLocaleString(lang, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <tr className={`${ROW} ${isFavorited ? '[&>td]:bg-accent/[0.05]' : ''}`}>
      <td className={`${TD_FIRST} w-16`}>
        {achievement.BadgeName && (
          <FadeImage
            src={raBadgeUrl(achievement.BadgeName)!}
            alt=""
            width={52}
            height={52}
            className={badgeClass(earnedHardcore ? 'hardcore' : earned ? 'softcore' : 'locked')}
            imgClassName={badgeImgClass(!earned)}
          />
        )}
      </td>

      <td className={TD}>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-[0.9375rem] font-bold">
            <button
              onClick={onClick}
              className="text-left rounded cursor-pointer before:absolute before:inset-0 before:content-[''] focus-ring"
            >
              {achievement.Title}
            </button>
          </h3>
          {typeBadge && <span className={`${TYPE_TAG} ${typeBadge.className}`}>{typeBadge.label}</span>}
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(achievement)}
              aria-label={isFavorited ? T.favorites.removeFavorite : T.favorites.addFavorite}
              aria-pressed={isFavorited}
              className={`relative z-10 shrink-0 rounded transition-colors duration-150 focus-ring ${
                isFavorited ? 'text-hardcore' : 'text-text-secondary/60 hover:text-hardcore'
              }`}
            >
              {isFavorited ? <IconStarFilled className="w-4 h-4" aria-hidden="true" /> : <IconStar className="w-4 h-4" aria-hidden="true" />}
            </button>
          )}
        </div>
        <p className="mt-0.5 text-[0.8125rem] leading-normal text-text-secondary">{achievement.Description}</p>
        {earnedDate && (
          <p className={`mt-0.5 text-xs ${earnedHardcore ? 'text-hardcore' : 'text-text-secondary'}`}>
            {earnedHardcore ? T.categoryPage.hardcore : T.categoryPage.softcore} · {earnedDate}
          </p>
        )}
      </td>

      <td className={`${TD} ${NUM} hidden sm:table-cell`}>{fmt(achievement.NumAwarded)}</td>
      <td className={`${TD} ${NUM} text-text-secondary hidden sm:table-cell`}>{fmt(achievement.NumAwardedHardcore)}</td>
      <td className={`${TD} ${MID} hidden sm:table-cell`}>
        <RarityBadge pct={rarityPct} />
      </td>
      <td className={`${TD} ${NUM} hidden sm:table-cell`}>
        {earned ? (
          <IconCheck className="w-[1.125rem] h-[1.125rem] text-success inline-block" aria-label={T.gameInfoTable.headerEarned} />
        ) : (
          <span className="text-text-secondary">—</span>
        )}
      </td>
      <td className={`${TD} ${NUM}`}>
        <span className="text-base font-extrabold">{achievement.Points}</span>
      </td>
    </tr>
  )
}
