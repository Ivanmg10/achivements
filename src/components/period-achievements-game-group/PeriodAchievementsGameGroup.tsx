import Image from 'next/image'
import { IconDeviceGamepad2 } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { PLATFORM_NAME } from '@/utils/gameRef'
import { plural } from '@/utils/utils'
import type { GameGroup } from '@/utils/periodDays'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import RecentAchievementRow from '@/components/recent-achievement-row/RecentAchievementRow'
import Facts from '@/components/ui/Facts'

/**
 * One game's unlocks of a day: its cover, title and platform once, then the achievements as a grid of badge and
 * title (each opens the game's page as in any row, the points only where the platform has them).
 */
export default function PeriodAchievementsGameGroup({ group, onNavigate }: { group: GameGroup; onNavigate: () => void }) {
  const { T, lang } = useLanguage()
  return (
    <section aria-label={group.title} className="flex flex-col gap-2">
      <div className="flex items-center gap-3 min-w-0">
        {group.image ? (
          <Image src={group.image} alt="" width={40} height={40} className="w-10 h-10 rounded-box object-cover shrink-0" unoptimized />
        ) : (
          <span aria-hidden="true" className="w-10 h-10 rounded-box bg-ink/10 flex items-center justify-center text-text-secondary shrink-0">
            <IconDeviceGamepad2 size={18} />
          </span>
        )}
        <div className="flex flex-col gap-0.5 min-w-0">
          <h4 className="text-sm font-semibold leading-snug line-clamp-2 wrap-break-word">{group.title}</h4>
          <p className="flex items-center text-xs text-text-secondary min-w-0">
            <PlatformLogo source={group.source} size={10} className="mr-1.5" />
            <Facts
              items={[
                <span key="p" className="truncate">{group.console || PLATFORM_NAME[group.source]}</span>,
                <span key="n" className="shrink-0">{plural(group.achievements.length, T.plurals.achievements, lang)}</span>,
              ]}
            />
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 enter-cards">
        {group.achievements.map((ach) => (
          <RecentAchievementRow key={ach.AchievementID} ach={ach} onNavigate={onNavigate} showGame={false} />
        ))}
      </div>
    </section>
  )
}
