import { IconLayoutGrid, IconLayoutRows } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

export const GROUP_VIEWS = ['covers', 'shelves'] as const
export type GroupView = (typeof GROUP_VIEWS)[number]

const OPTIONS = [
  { view: 'covers', icon: IconLayoutGrid, label: 'viewCovers' },
  { view: 'shelves', icon: IconLayoutRows, label: 'viewShelves' },
] as const

/** The two ways to see the groups list: cover cards or shelves of games. */
export default function GroupViewToggle({ value, onChange }: { value: GroupView; onChange: (view: GroupView) => void }) {
  const { T } = useLanguage()
  return (
    <div role="group" aria-label={T.groups.viewLabel} className="flex items-center gap-0.5 bg-bg-card rounded-lg p-0.5">
      {OPTIONS.map(({ view, icon: Icon, label }) => {
        const active = value === view
        return (
          <button
            key={view}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(view)}
            className={`flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
              active ? 'bg-bg-main text-accent ring-1 ring-ink/10 font-medium' : 'text-text-secondary hover:text-text-main'
            }`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{T.groups[label]}</span>
          </button>
        )
      })}
    </div>
  )
}
