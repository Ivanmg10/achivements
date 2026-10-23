import { IconPlus } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { GroupView } from '@/components/groups/group-view-toggle/GroupViewToggle'

/** The last place in the groups list: a new group, and how many more fit. */
export default function GroupNewTile({ view, remaining, onClick }: { view: GroupView; remaining: number; onClick: () => void }) {
  const { T } = useLanguage()
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full h-full flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-ink/10 text-text-secondary hover:text-accent hover:border-accent/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
        view === 'covers' ? 'flex-col min-h-64' : 'min-h-20'
      }`}
    >
      <IconPlus className="w-6 h-6 text-accent" aria-hidden="true" />
      <span className="text-sm font-medium">{T.groups.newGroup}</span>
      <span className="text-xs">{T.groups.slotsLeft.replace('{n}', String(remaining))}</span>
    </button>
  )
}
