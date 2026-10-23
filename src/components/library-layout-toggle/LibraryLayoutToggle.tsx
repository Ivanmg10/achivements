'use client'

import { IconLayoutGrid, IconLayoutRows, IconList } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import SegmentedControl from '@/components/ui/SegmentedControl'

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
    <SegmentedControl
      aria-label={T.libraryLayout.layoutLabel}
      size="xs"
      value={value}
      onChange={onChange}
      options={OPTIONS.map(({ layout, icon, label }) => ({ value: layout, icon, label: T.libraryLayout[label], compact: true }))}
    />
  )
}
