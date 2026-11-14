import Link from 'next/link'
import type { RecentAchievement } from '@/types/types'
import { achievementBadgeUrl, plural } from '@/utils/utils'
import { gameHref } from '@/utils/gameRef'
import { useSubject } from '@/context/SubjectContext'
import { useLanguage } from '@/context/LanguageContext'
import { FadeImage } from '@/components/ui/FadeImage'

const BADGE_BOX = 'w-9 h-9 rounded-box-sm shrink-0'
// What a badge that is missing or does not load leaves in its place, so the grid never has a hole.
const BADGE_PLACEHOLDER = <span aria-hidden="true" className={`block ${BADGE_BOX} bg-ink/10`} />

/**
 * One unlock in the day / week / period modals: badge, title, game, and RA's
 * points (hardcore in the warning colour). Links to the game's page on its own
 * platform; Steam unlocks have no points, so none are shown. `showGame={false}` leaves the game's title out.
 */
export default function RecentAchievementRow({
  ach,
  onNavigate,
  showGame = true,
}: {
  ach: RecentAchievement
  onNavigate: () => void
  /** Off where the game is already named above (a game's group in the day dialogs). */
  showGame?: boolean
}) {
  const subject = useSubject()
  const { T, lang } = useLanguage()
  const badge = achievementBadgeUrl(ach)
  // Steam, PSN and Xbox unlocks have no points.
  const isSteam = ach.Source === 'steam' || ach.Source === 'psn' || ach.Source === 'xbox'
  return (
    <Link
      href={gameHref(ach.Source ?? 'ra', ach.GameID, subject)}
      onClick={onNavigate}
      className="flex gap-2 items-center p-3 rounded-tile bg-bg-main hover:bg-bg-card transition-colors group min-w-0 focus-ring"
    >
      {badge ? (
        <FadeImage src={badge} alt={ach.Title} width={36} height={36} className={BADGE_BOX} unoptimized={isSteam} fallback={BADGE_PLACEHOLDER} />
      ) : (
        BADGE_PLACEHOLDER
      )}
      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        <span className="text-xs font-semibold text-text-main group-hover:text-accent transition-colors line-clamp-2">
          {ach.Title}
        </span>
        {showGame && <span className="text-[10px] text-text-secondary line-clamp-1">{ach.GameTitle}</span>}
      </div>
      {!isSteam && (
        <span className={`text-xs shrink-0 ${ach.HardcoreMode === '1' ? 'text-warning font-semibold' : 'text-text-secondary'}`}>
          {plural(ach.Points, T.plurals.points, lang)}
        </span>
      )}
    </Link>
  )
}
