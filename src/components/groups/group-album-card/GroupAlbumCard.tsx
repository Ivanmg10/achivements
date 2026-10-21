import Image from 'next/image'
import Link from 'next/link'
import { IconLock, IconPlus, IconWorld } from '@tabler/icons-react'
import { GameGroup } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { relativeTime, plural } from '@/utils/utils'
import { CircularProgress } from '@/components/ui/CircularProgress'
import { coverSrc } from '@/components/groups/group-cover-mosaic/GroupCoverMosaic'
import GroupIconDisplay from '@/components/groups/group-icon-display/GroupIconDisplay'
import GroupPlatformLogos from '@/components/groups/group-platform-logos/GroupPlatformLogos'

/**
 * A group as an album: its first games' covers as a banner, a ring with how far
 * along it is, its name, platforms and how many games are done or started. An
 * empty group shows empty slots and asks for games. The whole card opens it.
 */
export default function GroupAlbumCard({ group }: { group: GameGroup }) {
  const { T, lang } = useLanguage()
  const covers = (group.covers ?? []).map(coverSrc).filter((s): s is string => !!s).slice(0, 4)
  const pct = group.total_possible > 0 ? Math.min(100, Math.round((group.total_awarded / group.total_possible) * 100)) : 0
  const Privacy = group.is_public ? IconWorld : IconLock
  const empty = group.game_count === 0

  return (
    <Link
      href={`/groups/${group.id}`}
      className="spotlight group relative flex flex-col h-full bg-bg-card rounded-2xl overflow-hidden ring-1 ring-ink/5 hover:ring-ink/15 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      <div className="relative h-36 sm:h-44 overflow-hidden" aria-hidden="true">
        {covers.length > 0 ? (
          <div className="absolute inset-0 grid gap-0.5" style={{ gridTemplateColumns: `repeat(${covers.length}, minmax(0, 1fr))` }}>
            {covers.map((src, i) => (
              <Image key={i} src={src} alt="" width={240} height={240} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 grid grid-cols-4 gap-2 p-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border-2 border-dashed border-ink/10" />
            ))}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-bg-card/40 to-transparent" />
        {group.icon && (
          <span className="absolute top-3 left-3 w-9 h-9 rounded-lg bg-bg-card/80 overflow-hidden flex items-center justify-center [&>span]:text-xl [&>img]:w-full [&>img]:h-full">
            <GroupIconDisplay icon={group.icon} />
          </span>
        )}
      </div>

      <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-bg-main/80 text-text-secondary">
        <Privacy className="w-3 h-3" aria-hidden="true" />
        {group.is_public ? T.groups.public : T.groups.private}
      </span>

      <div className="relative -mt-12 px-4 sm:px-5 flex items-end gap-4">
        {group.total_possible > 0 && (
          <div className="rounded-full bg-bg-card p-1 shrink-0">
            <CircularProgress
              earned={group.total_awarded}
              total={group.total_possible}
              size={72}
              strokeWidth={7}
              ariaLabel={`${pct}%`}
              center={<span className={`text-base font-bold ${pct >= 100 ? 'text-success' : 'text-text-main'}`}>{pct}%</span>}
            />
          </div>
        )}
        <div className="flex flex-col gap-1 min-w-0 pb-1">
          <span className="text-xl font-bold truncate group-hover:text-accent transition-colors">{group.title}</span>
          <span className="flex items-center gap-2 text-xs text-text-secondary">
            {plural(group.game_count, T.plurals.games, lang)}
            <GroupPlatformLogos group={group} />
          </span>
        </div>
      </div>

      <div className="px-4 sm:px-5 pt-4 pb-5 mt-auto flex flex-wrap items-center gap-2 text-xs">
        {empty ? (
          <>
            <span className="text-text-secondary">{T.groups.emptyGroup}</span>
            <span className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-lg ring-1 ring-accent text-accent font-medium">
              <IconPlus className="w-3.5 h-3.5" aria-hidden="true" />
              {T.groups.addGames}
            </span>
          </>
        ) : (
          <>
            <span className="px-2.5 py-1 rounded-full bg-success/15 text-success">
              {T.groups.completedCount.replace('{n}', String(group.completed_count ?? 0))}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-ink/5 text-text-main">
              {T.groups.startedCount.replace('{n}', String(group.started_count ?? 0))}
            </span>
            <span className="ml-auto text-text-secondary truncate">
              {group.total_possible > 0 &&
                `${T.groups.achievementsCount.replace('{earned}', String(group.total_awarded)).replace('{total}', String(group.total_possible))} · `}
              {T.groups.updatedAgo.replace('{when}', relativeTime(group.updated_at, lang))}
            </span>
          </>
        )}
      </div>
    </Link>
  )
}
