'use client'

import Image from 'next/image'
import { CONSOLES } from '@/constants'

export type ConsolePill = { id: number; name: string; icon?: string }

export function buildConsolePills(games: { ConsoleID: number; ConsoleName: string }[]): ConsolePill[] {
  const map = new Map<number, ConsolePill>()
  // Seed with all known consoles so every platform shows regardless of current-category games
  for (const c of CONSOLES) {
    map.set(c.id, { id: c.id, name: c.name, icon: c.icon })
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
  if (pills.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
      {pills.map((c) => (
        <button
          key={c.id}
          onClick={() => onToggle(c.id)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            selected.has(c.id)
              ? 'bg-accent text-bg-main'
              : 'bg-bg-main text-text-secondary hover:text-text-main'
          }`}
        >
          {c.icon && (
            <Image
              src={c.icon}
              alt={c.name}
              width={14}
              height={14}
              className="object-contain shrink-0"
            />
          )}
          {c.name}
        </button>
      ))}
      {selected.size > 0 && (
        <button
          onClick={onClear}
          className="px-2.5 py-1 rounded-lg text-xs text-text-secondary/60 hover:text-text-secondary transition-colors cursor-pointer"
        >
          ✕ limpiar
        </button>
      )}
    </div>
  )
}
