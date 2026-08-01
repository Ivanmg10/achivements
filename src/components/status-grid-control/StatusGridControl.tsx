'use client'

import { IconLayoutList, IconLayoutGrid, IconGrid3x3 } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

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
    <div role="group" aria-label={T.statusGrid.label} className="hidden md:flex items-center gap-0.5 bg-bg-card rounded-lg p-0.5">
      {OPTIONS.map(({ cols: optionCols, icon: Icon }) => {
        const active = cols === optionCols
        return (
          <button
            key={optionCols}
            type="button"
            aria-pressed={active}
            aria-label={T.statusGrid[`cols${optionCols}` as 'cols1' | 'cols2' | 'cols3']}
            onClick={() => onChange(optionCols)}
            className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors cursor-pointer ${
              active ? 'bg-bg-main text-accent ring-1 ring-white/10' : 'text-text-secondary hover:text-text-main'
            }`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
