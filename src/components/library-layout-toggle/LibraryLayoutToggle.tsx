'use client'

import { useLanguage } from '@/context/LanguageContext'
import SegmentedControl from '@/components/ui/SegmentedControl'

export type LibraryLayout = 'shelves' | 'list' | 'cards'

const OPTIONS = [
  { layout: 'shelves', label: 'shelvesLabel' },
  { layout: 'list', label: 'listLabel' },
  { layout: 'cards', label: 'cardsLabel' },
] as const

/** The three ways to read a status list: shelves, a list with detail, or cards. */
export default function LibraryLayoutToggle({ value, onChange }: { value: LibraryLayout; onChange: (layout: LibraryLayout) => void }) {
  const { T } = useLanguage()
  return (
    <SegmentedControl
      aria-label={T.libraryLayout.layoutLabel}
      size="md"
      value={value}
      onChange={onChange}
      options={OPTIONS.map(({ layout, label }) => ({ value: layout, label: T.libraryLayout[label] }))}
    />
  )
}
