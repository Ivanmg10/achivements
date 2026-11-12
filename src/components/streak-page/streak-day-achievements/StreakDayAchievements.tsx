import Image from 'next/image'
import { RecentAchievement } from '@/types/types'
import { achievementBadgeUrl } from '@/utils/utils'
import { gameHref } from '@/utils/gameRef'
import ListRow from '@/components/ui/ListRow'

/**
 * Achievements of the picked day of a streak: the achievement and its game per
 * row, each opening the game. A hardcore unlock (RA) has its badge ringed.
 */
export default function StreakDayAchievements({ achievements }: { achievements: RecentAchievement[] }) {
  return (
    <ul className="flex flex-col">
      {achievements.map((ach) => {
        const badge = achievementBadgeUrl(ach)
        return (
          // A Steam unlock has no id of its own, so its number is only
          // unique within its own list: the source has to be in the key.
          <li key={`${ach.Source ?? 'ra'}:${ach.GameID}:${ach.AchievementID}`}>
            <ListRow
              href={gameHref(ach.Source ?? 'ra', ach.GameID)}
              title={ach.Title}
              sub={ach.GameTitle}
              media={
                <span className="relative w-full h-full">
                  {badge && <Image src={badge} alt="" width={40} height={40} className="w-10 h-10 object-cover" unoptimized />}
                  {ach.HardcoreMode === '1' && <span aria-hidden="true" className="absolute inset-0 rounded-box ring-2 ring-inset ring-hardcore/70" />}
                </span>
              }
            />
          </li>
        )
      })}
    </ul>
  )
}
