'use client'

import { useId } from 'react'
import { IconDeviceGamepad2 } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useHiddenConsoles } from '@/hooks/useHiddenConsoles'
import type { ConsoleOption } from '@/utils/consoleFilter'
import type { GameSource } from '@/types/steam'
import Checkbox from '@/components/ui/Checkbox'

/**
 * Which consoles of one platform show up: a tick per console the library has,
 * with how many games each holds. Unticked ones leave the lists, the collection
 * and the stats; nothing is deleted. Needs two consoles at least to be worth
 * choosing between; the list scrolls, since RA alone can have dozens.
 */
export default function UserConsolesPreference({ source, consoles }: { source: GameSource; consoles: ConsoleOption[] }) {
  const { T } = useLanguage()
  const { hidden, toggle, showAll } = useHiddenConsoles(source)
  const labelId = useId()
  const hintId = useId()

  if (consoles.length < 2) return null
  const shown = consoles.filter((c) => !hidden.has(c.name)).length

  return (
    <div role="group" aria-labelledby={labelId} aria-describedby={hintId} className="flex flex-col gap-2 rounded-tile px-2 -mx-1 py-1.5">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="w-9 h-9 shrink-0 rounded-tile bg-bg-card ring-1 ring-ink/[0.06] flex items-center justify-center text-text-secondary">
          <IconDeviceGamepad2 size={18} />
        </span>
        <span className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span id={labelId} className="text-xs text-text-secondary">{T.userData.consoles}</span>
          <span className="text-sm font-medium">{T.userData.consolesShown.replace('{n}', String(shown)).replace('{m}', String(consoles.length))}</span>
        </span>
        {hidden.size > 0 && (
          <button onClick={showAll} className="shrink-0 text-xs bg-bg-card px-3 py-1 rounded-full hover:bg-ink/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
            {T.userData.consolesAll}
          </button>
        )}
      </div>

      <p id={hintId} className="text-xs text-text-secondary">{T.userData.consolesHint}</p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-64 overflow-y-auto">
        {consoles.map((c) => {
          const id = `console-${source}-${c.name}`
          return (
            <li key={c.name}>
              <Checkbox id={id} checked={!hidden.has(c.name)} onChange={() => toggle(c.name)} className="rounded-box px-2 py-1.5 hover:bg-ink/5 text-sm">
                <span className="flex items-center gap-2">
                  <span className="truncate flex-1">{c.name}</span>
                <span className="text-xs text-text-secondary tabular-nums">{c.count}</span>
                </span>
              </Checkbox>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
