import type { IconLayoutGrid } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import SegmentedControl from '@/components/ui/SegmentedControl'

/** The groups list: cover cards or shelves of games. */
export const GROUP_VIEWS = ['covers', 'shelves'] as const
export type GroupView = (typeof GROUP_VIEWS)[number]
/** A group's page: a grid of covers or the detailed list. */
export const GROUP_DETAIL_VIEWS = ['covers', 'list'] as const
export type GroupDetailView = (typeof GROUP_DETAIL_VIEWS)[number]

export type ViewOption<V extends string> = { value: V; label: string; icon?: typeof IconLayoutGrid }

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
    <SegmentedControl
      aria-label={T.groups.viewLabel}
      value={value}
      onChange={onChange}
      options={options.map((o) => ({ ...o, compact: !!o.icon }))}
    />
  )
}
