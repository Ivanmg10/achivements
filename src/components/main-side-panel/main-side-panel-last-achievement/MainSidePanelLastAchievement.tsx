import { RecentAchievement } from '@/types/types'
import Image from 'next/image'

export default function MainSidePanelLastAchievement({ achievement }: { achievement: RecentAchievement }) {
  return (
    <section className="w-[90%] bg-bg-main rounded-2xl p-3 flex items-center gap-3">
      {achievement.BadgeName ? (
        <Image
          src={`https://media.retroachievements.org/Badge/${achievement.BadgeName}.png`}
          alt={achievement.Title}
          width={40}
          height={40}
          className="rounded-lg shrink-0"
          unoptimized
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-white/10 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-xs text-text-secondary truncate">{achievement.GameTitle}</p>
        <p className="text-sm font-medium truncate">{achievement.Title}</p>
        <p className="text-xs text-accent">{achievement.Points} pts</p>
      </div>
    </section>
  )
}
