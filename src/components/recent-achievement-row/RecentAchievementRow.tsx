import Image from 'next/image'
import Link from 'next/link'
import type { RecentAchievement } from '@/types/types'
import { achievementBadgeUrl } from '@/utils/utils'
import { gameHref } from '@/utils/gameRef'

/**
 * One unlock in the day / week / period modals: badge, title, game, and RA's
 * points (hardcore in the warning colour). Links to the game's page on its own
 * platform; Steam unlocks have no points, so none are shown.
 */
export default function RecentAchievementRow({ ach, onNavigate }: { ach: RecentAchievement; onNavigate: () => void }) {
  const badge = achievementBadgeUrl(ach)
  const isSteam = ach.Source === 'steam'
  return (
    <Link
      href={gameHref(ach.Source ?? 'ra', ach.GameID)}
      onClick={onNavigate}
      className="flex gap-2 items-center p-3 rounded-xl bg-bg-main hover:bg-bg-card transition-colors group min-w-0"
    >
      {badge ? (
        <Image src={badge} alt={ach.Title} width={36} height={36} className="rounded shrink-0" unoptimized={isSteam} />
      ) : (
        <div className="w-9 h-9 rounded bg-white/10 shrink-0" />
      )}
      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        <span className="text-xs font-semibold text-text-main group-hover:text-accent transition-colors line-clamp-2">
          {ach.Title}
        </span>
        <span className="text-[10px] text-text-secondary line-clamp-1">{ach.GameTitle}</span>
      </div>
      {!isSteam && (
        <span className={`text-xs shrink-0 ${ach.HardcoreMode === '1' ? 'text-warning font-semibold' : 'text-text-secondary'}`}>
          {ach.Points}pts
        </span>
      )}
    </Link>
  )
}
