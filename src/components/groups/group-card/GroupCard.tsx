import Link from 'next/link'
import { type CSSProperties } from 'react'
import { IconLock, IconWorld } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { GameGroup } from '@/types/types'
import { relativeTime } from '@/utils/utils'
import GroupIcon from '@/components/groups/group-icon/GroupIcon'

export default function GroupCard({
  group,
  itemRef,
  style,
}: {
  group: GameGroup
  itemRef?: (el: HTMLDivElement | null) => void
  style?: CSSProperties
}) {
  const { T } = useLanguage()

  return (
    <div ref={itemRef} style={style}>
      <Link
        href={`/groups/${group.id}`}
        className="flex items-center gap-4 bg-bg-card rounded-xl p-4 hover:bg-white/5 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        <GroupIcon group={group} />
        <div className="flex flex-col min-w-0 flex-1 gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate group-hover:text-accent transition-colors">
              {group.title}
            </span>
            {group.is_public ? (
              <IconWorld className="w-3.5 h-3.5 text-accent/60 shrink-0" aria-label="Public" />
            ) : (
              <IconLock className="w-3.5 h-3.5 text-text-secondary/60 shrink-0" aria-label="Private" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary shrink-0">
              {group.game_count} {T.groups.games}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-text-secondary/50">
            {group.total_possible > 0 && (
              <>
                <span>{group.total_awarded}/{group.total_possible} logros</span>
                <span className="opacity-40">·</span>
              </>
            )}
            <span>{relativeTime(group.updated_at)}</span>
          </div>
        </div>
      </Link>
    </div>
  )
}
