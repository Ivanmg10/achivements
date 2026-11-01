import Image from 'next/image'
import Link from 'next/link'
import { IconLock, IconPlus, IconWorld } from '@tabler/icons-react'
import { GameGroup } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { relativeTime, plural } from '@/utils/utils'
import { gameHref } from '@/utils/gameRef'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { coverSrc } from '@/components/groups/group-cover-mosaic/GroupCoverMosaic'
import GroupIconDisplay from '@/components/groups/group-icon-display/GroupIconDisplay'
import GroupPlatformLogos from '@/components/groups/group-platform-logos/GroupPlatformLogos'
import GroupProgressBar from '@/components/groups/group-progress-bar/GroupProgressBar'

const TILE = 'flex flex-col items-center justify-center gap-1 aspect-square rounded-tile border-2 border-dashed border-ink/10 text-xs text-text-secondary hover:text-accent hover:border-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'

/**
 * A group as a shelf: its name, progress and the game closest to done on one
 * side, its first games (each with its own progress, each opening its page) on
 * the other, and a last tile that opens the group: to see the rest, or to add some.
 */
export default function GroupShelfRow({ group }: { group: GameGroup }) {
  const { T, lang } = useLanguage()
  const Privacy = group.is_public ? IconWorld : IconLock
  const href = `/groups/${group.id}`
  const games = group.covers ?? []
  const more = group.game_count - games.length

  return (
    <article className="spotlight bg-bg-card rounded-card ring-1 ring-ink/5 p-4 sm:p-5 grid gap-5 md:grid-cols-[260px_1fr]">
      <div className="flex flex-col gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {group.icon && (
            <span className="w-8 h-8 rounded-box overflow-hidden flex items-center justify-center shrink-0 [&>span]:text-xl [&>img]:w-full [&>img]:h-full">
              <GroupIconDisplay icon={group.icon} />
            </span>
          )}
          <h2 className="min-w-0">
            <Link href={href} className="block text-xl font-bold truncate hover:text-accent transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
              {group.title}
            </Link>
          </h2>
          <Privacy className={`w-3.5 h-3.5 shrink-0 ${group.is_public ? 'text-accent' : 'text-text-secondary'}`} aria-hidden="true" />
          <span className="sr-only">{group.is_public ? T.groups.public : T.groups.private}</span>
        </div>
        <p className="flex items-center gap-2 text-xs text-text-secondary">
          {plural(group.game_count, T.plurals.games, lang)}
          <GroupPlatformLogos group={group} />
        </p>
        <GroupProgressBar earned={group.total_awarded} total={group.total_possible} label={group.title} className="mt-1" />
        <p className="text-xs text-text-secondary">
          {group.total_possible > 0 &&
            `${T.groups.achievementsCount.replace('{earned}', String(group.total_awarded)).replace('{total}', String(group.total_possible))} · `}
          {T.groups.updatedAgo.replace('{when}', relativeTime(group.updated_at, lang))}
        </p>
        {group.next_up && (
          <div className="mt-auto rounded-tile bg-bg-main/60 p-3 flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">{T.groups.nextUp}</span>
            <span className="text-sm">
              {T.groups.nextUpLeft.replace('{left}', String(group.next_up.left)).replace('{game}', group.next_up.title)}
            </span>
          </div>
        )}
      </div>

      <ul className="grid gap-3 content-start grid-cols-[repeat(auto-fill,minmax(6rem,7.5rem))]">
        {games.map((g) => {
          const src = coverSrc(g)
          const total = g.max_possible ?? 0
          const pct = total > 0 ? Math.min(100, Math.round(((g.num_awarded ?? 0) / total) * 100)) : 0
          return (
            <li key={`${g.source}:${g.game_id}`} className="min-w-0">
              <Link href={gameHref(g.source, g.game_id)} className="group flex flex-col gap-1.5 rounded-tile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
                <div className="aspect-square rounded-tile overflow-hidden bg-bg-main ring-1 ring-ink/5 group-hover:ring-ink/30 transition-all">
                  {src && <Image src={src} alt="" width={160} height={160} className="w-full h-full object-cover" unoptimized />}
                </div>
                <span className="text-xs truncate">{g.title}</span>
                {total > 0 && (
                  <span className="flex items-center gap-1.5">
                    <ProgressBar pct={pct} label={g.title ?? ''} className="flex-1" />
                    <span className={`text-[11px] tabular-nums ${pct >= 100 ? 'text-success font-semibold' : 'text-text-secondary'}`}>{pct}%</span>
                  </span>
                )}
              </Link>
            </li>
          )
        })}
        <li>
          <Link href={href} className={TILE}>
            {more > 0 ? (
              <span className="text-sm font-semibold">{T.groups.moreGames.replace('{n}', String(more))}</span>
            ) : (
              <>
                <IconPlus className="w-5 h-5" aria-hidden="true" />
                {T.groups.addGames}
              </>
            )}
          </Link>
        </li>
      </ul>
    </article>
  )
}
