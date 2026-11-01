'use client'

import Image from 'next/image'
import { IconCheck } from '@tabler/icons-react'
import { CONSOLES } from '@/constants'
import { useLanguage } from '@/context/LanguageContext'
import { pillClass } from '@/components/ui/Pill'

export type ConsolePill = { id: number; name: string; icon?: string; color?: string }


export function buildConsolePills(games: { ConsoleID: number; ConsoleName: string }[]): ConsolePill[] {
  const map = new Map<number, ConsolePill>()
  // Seed with all known consoles so every platform shows regardless of current-category games
  for (const c of CONSOLES) {
    map.set(c.id, { id: c.id, name: c.name, icon: c.icon, color: c.color })
  }
  // Add any extras the user has that aren't in the constant (e.g. NES, Atari)
  for (const g of games) {
    if (!map.has(g.ConsoleID)) {
      map.set(g.ConsoleID, { id: g.ConsoleID, name: g.ConsoleName })
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export default function ConsoleFilter({
  pills,
  selected,
  onToggle,
  onClear,
}: {
  pills: ConsolePill[]
  selected: Set<number>
  onToggle: (id: number) => void
  onClear: () => void
}) {
  const { T } = useLanguage()
  if (pills.length === 0) return null

  return (
    <div role="group" aria-label={T.categoryPage.consoles} className="flex gap-1.5 flex-1 min-w-0 overflow-x-auto [scrollbar-width:none] sm:flex-wrap sm:overflow-visible">
      {pills.map((c) => {
        const isSelected = selected.has(c.id)
        return (
          <button
            key={c.id}
            onClick={() => onToggle(c.id)}
            aria-pressed={isSelected}
            className={pillClass(isSelected, 'shrink-0')}
          >
            {c.icon && (
              <Image
                src={c.icon}
                alt=""
                width={14}
                height={14}
                className="object-contain shrink-0"
              />
            )}
            {c.name}
            {/* Selected is said by more than the colour. */}
            {isSelected && <IconCheck className="w-3 h-3 shrink-0" aria-hidden="true" />}
          </button>
        )
      })}
      {selected.size > 0 && (
        <button
          onClick={onClear}
          className="shrink-0 whitespace-nowrap px-2.5 py-1 rounded-chip text-xs text-text-secondary hover:text-text-main transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          <span aria-hidden="true">✕</span> {T.categoryPage.clearConsoles}
        </button>
      )}
    </div>
  )
}
