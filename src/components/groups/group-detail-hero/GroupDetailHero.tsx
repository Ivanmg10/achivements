import Image from 'next/image'
import Link from 'next/link'
import { IconArrowLeft, IconEdit, IconLock, IconPlus, IconTrash, IconWorld } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { GameGroup } from '@/types/types'
import type { Counts } from '@/utils/groupItems'
import { plural } from '@/utils/utils'
import GroupIconDisplay from '@/components/groups/group-icon-display/GroupIconDisplay'
import { CircularProgress } from '@/components/ui/CircularProgress'
import Button from '@/components/ui/Button'
import IconButton from '@/components/ui/IconButton'

/**
 * The top of a group's page: its games' covers as a faded banner, a ring with
 * how far along the whole group is, its privacy and size above its name, its
 * description, how many games are started, finished and not started, and what
 * can be done to it (add games, edit, delete).
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
                size={128}
                strokeWidth={10}
                ariaLabel={`${pct}%`}
                center={<span className={`font-display italic font-extrabold text-[2.5rem] pr-1 ${pct >= 100 ? 'text-success' : 'text-text-main'}`}>{pct}%</span>}
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-control bg-bg-main ring-1 ring-ink/5 flex items-center justify-center shrink-0 overflow-hidden">
              <GroupIconDisplay icon={group.icon} />
            </div>
          )}

          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <p className="flex items-center gap-2 flex-wrap text-[0.8125rem] text-text-main">
              <span className="inline-flex items-center gap-1 h-[1.375rem] px-2 rounded-[0.375rem] text-xs font-bold bg-black/45">
                <Privacy className="w-3 h-3" aria-hidden="true" />
                {group.is_public ? T.groups.public : T.groups.private}
              </span>
              {plural(gameCount, T.plurals.games, lang)}
              {summary.total > 0 && ` · ${T.groups.summary.replace('{earned}', String(summary.earned)).replace('{total}', String(summary.total))}`}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {summary.total > 0 && group.icon && (
                <span className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0 [&>span]:text-2xl [&>img]:w-full [&>img]:h-full">
                  <GroupIconDisplay icon={group.icon} />
                </span>
              )}
              <h1 className="font-display italic font-extrabold text-5xl sm:text-[4.5rem] leading-[0.95] pr-2 text-text-main break-words">{group.title}</h1>
            </div>
            {group.description && <p className="text-sm text-text-main/80">{group.description}</p>}
            {gameCount > 0 && (
              <ul className="flex flex-wrap gap-1.5 text-xs font-bold">
                <li className="h-[1.375rem] inline-flex items-center px-2 rounded-[0.375rem] bg-info/15 text-info">{T.groups.startedCount.replace('{n}', String(states.started))}</li>
                <li className="h-[1.375rem] inline-flex items-center px-2 rounded-[0.375rem] bg-success/15 text-success">{T.groups.completedCount.replace('{n}', String(states.done))}</li>
                <li className="h-[1.375rem] inline-flex items-center px-2 rounded-[0.375rem] bg-black/40 text-text-secondary">{T.groups.notStartedCount.replace('{n}', String(states.notStarted))}</li>
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
            <IconButton size="lg" onClick={onEdit} aria-label={T.groups.editGroup}>
              <IconEdit className="w-4 h-4" aria-hidden="true" />
            </IconButton>
            <IconButton size="lg" tone="danger" onClick={onDelete} aria-label={T.groups.deleteGroup}>
              <IconTrash className="w-4 h-4" aria-hidden="true" />
            </IconButton>
          </div>
        </div>
      </div>
    </header>
  )
}
