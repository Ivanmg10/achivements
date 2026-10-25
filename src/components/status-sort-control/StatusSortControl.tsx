'use client'

import { useEffect, useRef, useState } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useClickAway } from '@/hooks/useClickAway'
import { MENU_SURFACE, menuItemClass } from '@/components/ui/menu'
import { buttonClass } from '@/components/ui/Button'

export type StatusSortKey = 'name' | 'lastPlayed' | 'percent' | 'points'
export type SortDir = 'asc' | 'desc'
export type StatusSortState = { key: StatusSortKey; dir: SortDir }

const STATUS_SORT_DEFAULT_DIRS: Record<StatusSortKey, SortDir> = {
  name: 'asc',
  lastPlayed: 'desc',
  percent: 'desc',
  points: 'desc',
}

const STATUS_SORT_KEYS_BY_CATEGORY: Record<string, StatusSortKey[]> = {
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
  keys: only,
}: {
  cat: string
  /** Restrict the offered orders, for a list that cannot sort by all of them. */
  keys?: StatusSortKey[]
  sortState: StatusSortState
  onChange: (s: StatusSortState) => void
}) {
  const { T } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  useClickAway(ref, isOpen, () => setIsOpen(false))

  // Escape closes the list and hands the focus back to the button.
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      setIsOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  const keys = only ?? STATUS_SORT_KEYS_BY_CATEGORY[cat] ?? STATUS_SORT_KEYS_BY_CATEGORY.playing
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
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((o) => !o)}
        className={buttonClass('secondary', 'md')}
      >
        <span className="sr-only">{T.statusSort.label}: </span>
        {T.statusSort[sortState.key]} <span aria-hidden="true">{arrow}</span>
        <IconChevronDown
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {isOpen && (
        <div
          className={`absolute top-full right-0 mt-1 z-20 min-w-40 ${MENU_SURFACE}`}
        >
          {keys.map((key) => {
            const active = sortState.key === key
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => handleSelect(key)}
                className={menuItemClass(active)}
              >
                {T.statusSort[key]} {active && <span aria-hidden="true">{arrow}</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
