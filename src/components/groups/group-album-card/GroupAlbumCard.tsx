import Image from 'next/image'
import Link from 'next/link'
import { IconLock, IconPlus, IconWorld } from '@tabler/icons-react'
import { GameGroup } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { relativeTime, plural } from '@/utils/utils'
import { ProgressBar } from '@/components/ui/ProgressBar'
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
      className="group relative flex flex-col h-full bg-bg-card rounded-card overflow-hidden ring-1 ring-inset ring-ink/[0.06] hover:ring-accent/60 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      <div className="relative h-[9.375rem] overflow-hidden" aria-hidden="true">
        {covers.length > 0 ? (
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${covers.length}, minmax(0, 1fr))` }}>
            {covers.map((src, i) => (
              <Image key={i} src={src} alt="" width={240} height={240} className="w-full h-full object-cover" unoptimized />
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 grid grid-cols-4 gap-2 p-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border-2 border-dashed border-ink/10" />
            ))}
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgb(var(--bg-card)))]" />
        {group.icon && (
          <span className="absolute top-3 left-3 w-9 h-9 rounded-lg bg-bg-card/80 overflow-hidden flex items-center justify-center [&>span]:text-xl [&>img]:w-full [&>img]:h-full">
            <GroupIconDisplay icon={group.icon} />
          </span>
        )}
      </div>

      <div className="relative -mt-10 px-5 pb-5 flex flex-col gap-2.5 flex-1">
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-2xl font-extrabold truncate group-hover:text-accent transition-colors">{group.title}</span>
          <span className="inline-flex items-center gap-1.5 h-[1.375rem] px-2 rounded-[0.375rem] font-bold whitespace-nowrap bg-ink/10 text-text-secondary text-xs shrink-0">
            <Privacy className="w-3 h-3" aria-hidden="true" />
            {group.is_public ? T.groups.public : T.groups.private}
          </span>
          {group.total_possible > 0 && (
            <span className={`ml-auto text-xl font-extrabold tabular-nums shrink-0 ${pct >= 100 ? 'text-success' : ''}`}>{pct}%</span>
          )}
        </span>
        {group.total_possible > 0 && <ProgressBar pct={pct} label={group.title} />}

        <span className="flex flex-wrap items-center gap-1.5 text-xs mt-auto">
          <span className="inline-flex items-center gap-1.5 h-[1.375rem] px-2 rounded-[0.375rem] font-bold whitespace-nowrap bg-ink/[0.07] text-text-secondary">
            {plural(group.game_count, T.plurals.games, lang)}
            <GroupPlatformLogos group={group} />
          </span>
          {empty ? (
            <span className="ml-auto inline-flex items-center gap-1 text-accent font-semibold">
              <IconPlus className="w-3.5 h-3.5" aria-hidden="true" />
              {T.groups.addGames}
            </span>
          ) : (
            <>
              {(group.started_count ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1.5 h-[1.375rem] px-2 rounded-[0.375rem] font-bold whitespace-nowrap bg-info/[0.14] text-info">{T.groups.startedCount.replace('{n}', String(group.started_count))}</span>
              )}
              {(group.completed_count ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1.5 h-[1.375rem] px-2 rounded-[0.375rem] font-bold whitespace-nowrap bg-success/[0.14] text-success">{T.groups.completedCount.replace('{n}', String(group.completed_count))}</span>
              )}
              <span className="ml-auto text-text-secondary truncate">
                {group.total_possible > 0 &&
                  `${T.groups.achievementsCount.replace('{earned}', String(group.total_awarded)).replace('{total}', String(group.total_possible))} · `}
                {relativeTime(group.updated_at, lang)}
              </span>
            </>
          )}
        </span>
      </div>
    </Link>
  )
}
