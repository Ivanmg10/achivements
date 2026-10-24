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

const ACTION = 'flex items-center justify-center w-10 h-10 rounded-control ring-1 ring-inset ring-white/15 bg-black/30 text-text-main transition-colors focus-visible:outline-none focus-visible:ring-2'

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
    <header className="relative -mx-4 sm:mx-0 sm:rounded-card overflow-hidden bg-bg-card ring-1 ring-ink/5 sm:min-h-72 flex flex-col">
      <div aria-hidden="true" className="absolute inset-0">
        {covers.length > 0 && (
          <div className="absolute inset-0 grid opacity-60" style={{ gridTemplateColumns: `repeat(${covers.length}, minmax(0, 1fr))` }}>
            {covers.map((src, i) => (
              <Image key={i} src={src} alt="" width={240} height={240} className="w-full h-full object-cover blur-[6px] scale-105" unoptimized />
            ))}
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(var(--bg-card))_0%,rgb(var(--bg-card)/0.85)_40%,rgb(var(--bg-card)/0.25)_100%),linear-gradient(0deg,rgb(var(--bg-card)/0.85),transparent_60%)]" />
      </div>

      <div className="relative flex-1 flex flex-col justify-end gap-5 px-4 sm:px-9 pt-5 pb-7 sm:pt-24">
        <Link
          href="/groups"
          className="sm:absolute sm:top-6 sm:left-9 self-start font-semibold inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-main rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          <IconArrowLeft className="w-4 h-4" aria-hidden="true" />
          {T.groups.backToGroups}
        </Link>

        <div className="flex flex-col md:flex-row md:items-end gap-5 md:gap-7">
          {summary.total > 0 ? (
            <div className="self-start md:self-auto shrink-0">
              <CircularProgress
                earned={summary.earned}
                total={summary.total}
                size={120}
                strokeWidth={10}
                ariaLabel={`${pct}%`}
                center={<span className={`font-display italic font-extrabold text-4xl pr-1 ${pct >= 100 ? 'text-success' : 'text-text-main'}`}>{pct}%</span>}
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-control bg-bg-main ring-1 ring-ink/5 flex items-center justify-center shrink-0 overflow-hidden">
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
              <h1 className="font-display italic font-extrabold text-5xl sm:text-7xl leading-[0.95] pr-2 text-text-main break-words">{group.title}</h1>
              <span className="inline-flex items-center gap-1 h-6 px-2 rounded-chip text-xs font-bold bg-black/40 text-text-main">
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
              <ul className="flex flex-wrap gap-2 mt-1 text-xs font-bold">
                <li className="h-6 inline-flex items-center px-2.5 rounded-chip bg-success/15 text-success">{T.groups.completedCount.replace('{n}', String(states.done))}</li>
                <li className="h-6 inline-flex items-center px-2.5 rounded-chip bg-info/15 text-info">{T.groups.startedCount.replace('{n}', String(states.started))}</li>
                <li className="h-6 inline-flex items-center px-2.5 rounded-chip bg-black/35 text-text-secondary">{T.groups.notStartedCount.replace('{n}', String(states.notStarted))}</li>
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
