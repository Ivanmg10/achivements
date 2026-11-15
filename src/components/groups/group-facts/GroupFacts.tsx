import { GameGroup } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { plural } from '@/utils/utils'
import { relativeTime } from '@/utils/dates'
import GroupPlatformLogos from '@/components/groups/group-platform-logos/GroupPlatformLogos'
import Facts from '@/components/ui/Facts'

/**
 * A group's foot, said once on one line: "4 games / 4 in progress / 141/176
 * achievements / 12 d ago", the platforms' logos beside the games. What a group
 * has none of (no game started, no achievements to earn) is left out with its mark.
 */
export default function GroupFacts({ group, className = '' }: { group: GameGroup; className?: string }) {
  const { T, lang } = useLanguage()
  const started = group.started_count ?? 0

  return (
    <p className={`text-xs text-text-secondary ${className}`}>
      <Facts
        items={[
          <span key="games" className="inline-flex items-center gap-1.5 align-middle">
            {plural(group.game_count, T.plurals.games, lang)}
            <GroupPlatformLogos group={group} />
          </span>,
          started > 0 && T.groups.startedCount.replace('{n}', started.toLocaleString(lang)),
          group.total_possible > 0 && T.groups.achievementsCount.replace('{earned}', group.total_awarded.toLocaleString(lang)).replace('{total}', group.total_possible.toLocaleString(lang)),
          relativeTime(group.updated_at, lang),
        ]}
      />
    </p>
  )
}
