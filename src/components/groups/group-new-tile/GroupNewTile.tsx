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
      className={`w-full h-full flex items-center justify-center gap-2 rounded-card text-text-main ring-[1.5px] ring-inset ring-accent/35 hover:ring-accent bg-[repeating-linear-gradient(-60deg,rgb(var(--accent)/0.05)_0_10px,transparent_10px_20px)] transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
        view === 'covers' ? 'flex-col min-h-[16.75rem]' : 'min-h-20'
      }`}
    >
      <IconPlus className="w-[1.625rem] h-[1.625rem] text-accent" aria-hidden="true" />
      <span className="text-base font-bold">{T.groups.newGroup}</span>
      <span className="text-[0.8125rem] text-text-secondary">{T.groups.slotsLeft.replace('{n}', String(remaining))}</span>
    </button>
  )
}
