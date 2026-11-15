'use client'

import { IconLayoutList, IconLayoutGrid, IconGrid3x3 } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import SegmentedControl from '@/components/ui/SegmentedControl'

export type StatusGridCols = 1 | 2 | 3

const OPTIONS: { cols: StatusGridCols; icon: typeof IconLayoutList }[] = [
  { cols: 1, icon: IconLayoutList },
  { cols: 2, icon: IconLayoutGrid },
  { cols: 3, icon: IconGrid3x3 },
]

export default function StatusGridControl({
  cols,
  onChange,
}: {
  cols: StatusGridCols
  onChange: (cols: StatusGridCols) => void
}) {
  const { T } = useLanguage()

  return (
    <SegmentedControl
      aria-label={T.statusGrid.label}
      size="xs"
      className="hidden! md:inline-grid!"
      value={String(cols) as '1' | '2' | '3'}
      onChange={(v) => onChange(Number(v) as StatusGridCols)}
      options={OPTIONS.map(({ cols: n, icon }) => ({
        value: String(n) as '1' | '2' | '3',
        icon,
        iconOnly: true,
        label: T.statusGrid[`cols${n}` as 'cols1' | 'cols2' | 'cols3'],
      }))}
    />
  )
}
