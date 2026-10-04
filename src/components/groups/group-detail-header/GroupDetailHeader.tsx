import { IconEdit, IconLock, IconPlus, IconTrash, IconWorld } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { GameGroup } from '@/types/types'
import type { Counts } from '@/utils/groupItems'
import GroupIconDisplay from '@/components/groups/group-icon-display/GroupIconDisplay'
import GroupProgressBar from '@/components/groups/group-progress-bar/GroupProgressBar'
import StatusGridControl, { StatusGridCols } from '@/components/status-grid-control/StatusGridControl'
import { plural } from '@/utils/utils'

const ACTION = 'p-2 rounded-lg transition-colors text-text-secondary focus-visible:outline-none focus-visible:ring-2'

/**
 * The top of a group's page: its icon, title, privacy, description, how far
 * along the whole group is, and what can be done to it (layout, add a game,
 * edit, delete).
 */
export default function GroupDetailHeader({
  group,
  gameCount,
  summary,
  gridCols,
  onGridCols,
  onAdd,
  onEdit,
  onDelete,
}: {
  group: GameGroup
  gameCount: number
  summary: Counts
  gridCols: StatusGridCols
  onGridCols: (cols: StatusGridCols) => void
  onAdd: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { T, lang } = useLanguage()
  const Privacy = group.is_public ? IconWorld : IconLock

  return (
    <header className="flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-16 h-16 rounded-2xl bg-bg-card ring-1 ring-ink/5 flex items-center justify-center shrink-0 overflow-hidden">
          <GroupIconDisplay icon={group.icon} />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-text-main break-words">{group.title}</h1>
            <span
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
                group.is_public ? 'bg-accent/10 text-accent' : 'bg-ink/5 text-text-secondary'
              }`}
            >
              <Privacy className="w-3 h-3" aria-hidden="true" />
              {group.is_public ? T.groups.public : T.groups.private}
            </span>
          </div>
          {group.description && <p className="text-sm text-text-secondary">{group.description}</p>}
          <p className="text-xs text-text-secondary">
            {plural(gameCount, T.plurals.games, lang)}
            {summary.total > 0 && (
              <>
                {' · '}
                {T.groups.summary.replace('{earned}', String(summary.earned)).replace('{total}', String(summary.total))}
              </>
            )}
          </p>
          <GroupProgressBar earned={summary.earned} total={summary.total} label={T.groups.title} className="max-w-md mt-1" />
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {gameCount > 0 && <StatusGridControl cols={gridCols} onChange={onGridCols} />}
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-bg-main text-sm font-medium hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          <IconPlus className="w-4 h-4" aria-hidden="true" />
          {T.groups.addGame}
        </button>
        <button onClick={onEdit} aria-label={T.groups.editGroup} className={`${ACTION} hover:bg-bg-card hover:text-text-main focus-visible:ring-accent/70`}>
          <IconEdit className="w-4 h-4" aria-hidden="true" />
        </button>
        <button onClick={onDelete} aria-label={T.groups.deleteGroup} className={`${ACTION} hover:bg-danger/10 hover:text-danger focus-visible:ring-danger/70`}>
          <IconTrash className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
