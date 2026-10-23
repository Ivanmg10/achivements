import Image from 'next/image'
import Link from 'next/link'
import { IconArrowLeft, IconEdit, IconLock, IconPlus, IconTrash, IconWorld } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { GameGroup } from '@/types/types'
import type { Counts } from '@/utils/groupItems'
import { plural } from '@/utils/utils'
import { CircularProgress } from '@/components/ui/CircularProgress'
import GroupIconDisplay from '@/components/groups/group-icon-display/GroupIconDisplay'
import Button from '@/components/ui/Button'

const ACTION = 'flex items-center justify-center w-10 h-10 rounded-xl ring-1 ring-ink/10 bg-bg-card/80 text-text-secondary transition-colors focus-visible:outline-none focus-visible:ring-2'

/**
 * The top of a group's page: its games' covers as a faded banner, a ring with
 * how far along the whole group is, its name, privacy and description, how
 * many games are finished, started and not started, and what can be done to
 * it (add games, edit, delete).
 */
export default function GroupDetailHero({
  group,
  covers,
  gameCount,
  summary,
  states,
  onAdd,
  onEdit,
  onDelete,
}: {
  group: GameGroup
  /** Cover images of the group's first games, in order. */
  covers: string[]
  gameCount: number
  summary: Counts
  states: { done: number; started: number; notStarted: number }
  onAdd: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { T, lang } = useLanguage()
  const Privacy = group.is_public ? IconWorld : IconLock
  const pct = summary.total > 0 ? Math.min(100, Math.round((summary.earned / summary.total) * 100)) : 0

  return (
    <header className="relative -mx-4 sm:mx-0 sm:rounded-3xl overflow-hidden bg-bg-card ring-1 ring-ink/5">
      <div aria-hidden="true" className="absolute inset-0">
        {covers.length > 0 && (
          <div className="absolute inset-0 grid opacity-30" style={{ gridTemplateColumns: `repeat(${covers.length}, minmax(0, 1fr))` }}>
            {covers.map((src, i) => (
              <Image key={i} src={src} alt="" width={240} height={240} className="w-full h-full object-cover blur-[2px]" unoptimized />
            ))}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-bg-card/70 to-bg-card/10" />
      </div>

      <div className="relative flex flex-col gap-5 px-4 sm:px-8 pt-5 pb-6 sm:pt-24">
        <Link
          href="/groups"
          className="sm:absolute sm:top-5 sm:left-8 self-start inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-main rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          <IconArrowLeft className="w-4 h-4" aria-hidden="true" />
          {T.groups.backToGroups}
        </Link>

        <div className="flex flex-col md:flex-row md:items-end gap-5">
          {summary.total > 0 ? (
            <div className="rounded-full bg-bg-card p-1.5 self-start md:self-auto shrink-0">
              <CircularProgress
                earned={summary.earned}
                total={summary.total}
                size={112}
                strokeWidth={9}
                ariaLabel={`${pct}%`}
                center={<span className={`text-2xl font-bold ${pct >= 100 ? 'text-success' : 'text-text-main'}`}>{pct}%</span>}
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-bg-main ring-1 ring-ink/5 flex items-center justify-center shrink-0 overflow-hidden">
              <GroupIconDisplay icon={group.icon} />
            </div>
          )}

          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {summary.total > 0 && group.icon && (
                <span className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0 [&>span]:text-2xl [&>img]:w-full [&>img]:h-full">
                  <GroupIconDisplay icon={group.icon} />
                </span>
              )}
              <h1 className="text-2xl sm:text-4xl font-bold text-text-main break-words">{group.title}</h1>
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-bg-main/70 text-text-secondary">
                <Privacy className="w-3 h-3" aria-hidden="true" />
                {group.is_public ? T.groups.public : T.groups.private}
              </span>
            </div>
            {group.description && <p className="text-sm text-text-main/80">{group.description}</p>}
            <p className="text-sm text-text-secondary">
              {plural(gameCount, T.plurals.games, lang)}
              {summary.total > 0 && ` · ${T.groups.summary.replace('{earned}', String(summary.earned)).replace('{total}', String(summary.total))}`}
            </p>
            {gameCount > 0 && (
              <ul className="flex flex-wrap gap-2 mt-1 text-xs">
                <li className="px-2.5 py-1 rounded-full bg-success/15 text-success">{T.groups.completedCount.replace('{n}', String(states.done))}</li>
                <li className="px-2.5 py-1 rounded-full bg-bg-main/70 text-text-main">{T.groups.startedCount.replace('{n}', String(states.started))}</li>
                <li className="px-2.5 py-1 rounded-full bg-bg-main/70 text-text-main">{T.groups.notStartedCount.replace('{n}', String(states.notStarted))}</li>
              </ul>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              onClick={onAdd}
            >
              <IconPlus className="w-4 h-4" aria-hidden="true" />
              {T.groups.addGames}
            </Button>
            <button type="button" onClick={onEdit} aria-label={T.groups.editGroup} className={`${ACTION} hover:text-text-main focus-visible:ring-accent/70`}>
              <IconEdit className="w-4 h-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={onDelete} aria-label={T.groups.deleteGroup} className={`${ACTION} hover:bg-danger/10 hover:text-danger focus-visible:ring-danger/70`}>
              <IconTrash className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
