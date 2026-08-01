'use client'

import { useRef, useState } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useClickAway } from '@/hooks/useClickAway'

export type StatusSortKey = 'name' | 'lastPlayed' | 'percent' | 'points'
export type SortDir = 'asc' | 'desc'
export type StatusSortState = { key: StatusSortKey; dir: SortDir }

export const STATUS_SORT_DEFAULT_DIRS: Record<StatusSortKey, SortDir> = {
  name: 'asc',
  lastPlayed: 'desc',
  percent: 'desc',
  points: 'desc',
}

export const STATUS_SORT_KEYS_BY_CATEGORY: Record<string, StatusSortKey[]> = {
  wantToPlay: ['name', 'points'],
  playing: ['name', 'lastPlayed', 'percent', 'points'],
  completed: ['name', 'lastPlayed', 'percent', 'points'],
}

export function defaultSortStateFor(cat: string): StatusSortState {
  return cat === 'wantToPlay' ? { key: 'name', dir: 'asc' } : { key: 'lastPlayed', dir: 'desc' }
}

export default function StatusSortControl({
  cat,
  sortState,
  onChange,
}: {
  cat: string
  sortState: StatusSortState
  onChange: (s: StatusSortState) => void
}) {
  const { T } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickAway(ref, isOpen, () => setIsOpen(false))

  const keys = STATUS_SORT_KEYS_BY_CATEGORY[cat] ?? STATUS_SORT_KEYS_BY_CATEGORY.playing
  const arrow = sortState.dir === 'asc' ? '↑' : '↓'

  function handleSelect(key: StatusSortKey) {
    onChange(
      key === sortState.key
        ? { key, dir: sortState.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: STATUS_SORT_DEFAULT_DIRS[key] },
    )
    setIsOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={T.statusSort.label}
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-lg bg-bg-card text-text-secondary hover:text-text-main transition-colors cursor-pointer"
      >
        {T.statusSort.label}: {T.statusSort[sortState.key]} {arrow}
        <IconChevronDown
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {isOpen && (
        <div
          role="menu"
          className="absolute top-full right-0 mt-1 z-20 bg-bg-card rounded-lg shadow-lg py-1 min-w-40"
        >
          {keys.map((key) => {
            const active = sortState.key === key
            return (
              <button
                key={key}
                type="button"
                role="menuitem"
                onClick={() => handleSelect(key)}
                className={`w-full text-left text-sm px-3 py-1.5 transition-colors cursor-pointer ${
                  active ? 'text-accent font-medium' : 'text-text-secondary hover:text-text-main'
                }`}
              >
                {T.statusSort[key]} {active ? arrow : ''}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
