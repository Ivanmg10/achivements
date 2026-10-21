import type { IconLayoutGrid } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/** The groups list: cover cards or shelves of games. */
export const GROUP_VIEWS = ['covers', 'shelves'] as const
export type GroupView = (typeof GROUP_VIEWS)[number]
/** A group's page: a grid of covers or the detailed list. */
export const GROUP_DETAIL_VIEWS = ['covers', 'list'] as const
export type GroupDetailView = (typeof GROUP_DETAIL_VIEWS)[number]

export type ViewOption<V extends string> = { value: V; label: string; icon: typeof IconLayoutGrid }

/** A choice among a few ways to see the same games; the current one is pressed. */
export default function GroupViewToggle<V extends string>({
  options,
  value,
  onChange,
}: {
  options: ViewOption<V>[]
  value: V
  onChange: (view: V) => void
}) {
  const { T } = useLanguage()
  return (
    <div role="group" aria-label={T.groups.viewLabel} className="flex items-center gap-0.5 bg-bg-card rounded-lg p-0.5">
      {options.map(({ value: view, icon: Icon, label }) => {
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
            <span className="sr-only sm:not-sr-only">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
