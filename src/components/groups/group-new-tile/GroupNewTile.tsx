import { IconPlus } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { GroupView } from '@/components/groups/group-view-toggle/GroupViewToggle'
import DropSlot from '@/components/ui/DropSlot'

/** The last place in the groups list: a new group, and how many more fit. */
export default function GroupNewTile({ view, remaining, onClick }: { view: GroupView; remaining: number; onClick: () => void }) {
  const { T } = useLanguage()
  return (
    <DropSlot
      label={T.groups.newGroup}
      onClick={onClick}
      className={view === 'covers' ? 'flex-col min-h-[16.75rem]' : 'min-h-20'}
    >
      <IconPlus className="w-[1.625rem] h-[1.625rem] text-accent" aria-hidden="true" />
      <span className="text-base font-bold">{T.groups.newGroup}</span>
      <span className="text-[0.8125rem] text-text-secondary">{T.groups.slotsLeft.replace('{n}', String(remaining))}</span>
    </DropSlot>
  )
}
