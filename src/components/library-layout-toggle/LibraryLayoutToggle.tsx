'use client'

import { IconLayoutGrid, IconLayoutRows, IconList } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

export type LibraryLayout = 'shelves' | 'list' | 'cards'

const OPTIONS = [
  { layout: 'shelves', icon: IconLayoutRows, label: 'shelvesLabel' },
  { layout: 'list', icon: IconList, label: 'listLabel' },
  { layout: 'cards', icon: IconLayoutGrid, label: 'cardsLabel' },
] as const

/** The three ways to read a status list: shelves, a list with detail, or cards. */
export default function LibraryLayoutToggle({ value, onChange }: { value: LibraryLayout; onChange: (layout: LibraryLayout) => void }) {
  const { T } = useLanguage()
  return (
    <div role="group" aria-label={T.libraryLayout.layoutLabel} className="flex items-center gap-0.5 bg-bg-card rounded-lg p-0.5">
      {OPTIONS.map(({ layout, icon: Icon, label }) => {
        const active = value === layout
        return (
          <button
            key={layout}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(layout)}
            className={`flex items-center gap-1.5 h-7 px-2 rounded-md text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
              active ? 'bg-bg-main text-accent ring-1 ring-ink/10 font-medium' : 'text-text-secondary hover:text-text-main'
            }`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{T.libraryLayout[label]}</span>
          </button>
        )
      })}
    </div>
  )
}
