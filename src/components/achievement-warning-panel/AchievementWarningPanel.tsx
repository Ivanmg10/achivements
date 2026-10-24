'use client'

import { useId, useState } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import { FadeImage } from '@/components/ui/FadeImage'

export type WarningItem = { key: string; title: string; description: string; iconUrl: string | null; onSelect: () => void }

const TONE = {
  danger: {
    box: 'ring-danger/30',
    head: 'bg-danger/10 hover:bg-danger/15 focus-visible:ring-danger/70',
    text: 'text-danger',
    body: 'bg-danger/5',
    item: 'hover:bg-danger/10 focus-visible:ring-danger/70',
  },
  warning: {
    box: 'ring-warning/30',
    head: 'bg-warning/10 hover:bg-warning/15 focus-visible:ring-warning/70',
    text: 'text-warning',
    body: 'bg-warning/5',
    item: 'hover:bg-warning/10 focus-visible:ring-warning/70',
  },
}

/**
 * A folded warning over a game's achievement table, listing the ones that
 * need care before it is too late: RA's missables, Steam's online-only ones
 * (servers close). Each opens its achievement. Nothing when the list is empty.
 */
export default function AchievementWarningPanel({
  label,
  items,
  tone = 'danger',
}: {
  label: string
  items: WarningItem[]
  tone?: keyof typeof TONE
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const c = TONE[tone]

  if (items.length === 0) return null

  return (
    <div className={`w-full ring-1 ring-inset rounded-control overflow-hidden ${c.box}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`w-full flex items-center justify-between px-4 py-3 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset ${c.head}`}
      >
        <span className={`font-semibold text-sm ${c.text}`}>
          {label} ({items.length})
        </span>
        <IconChevronDown className={`w-4 h-4 transition-transform duration-200 ${c.text} ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div id={panelId} className={`flex flex-col gap-2 p-4 ${c.body}`}>
          {items.map((item) => (
            <button
              type="button"
              key={item.key}
              onClick={item.onSelect}
              className={`flex items-center gap-3 text-left w-full rounded-lg p-1 -m-1 transition-colors focus-visible:outline-none focus-visible:ring-2 ${c.item}`}
            >
              {item.iconUrl ? (
                <FadeImage
                  src={item.iconUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-lg shrink-0"
                  imgClassName="w-full h-full object-cover grayscale"
                  unoptimized
                />
              ) : (
                <span className="w-10 h-10 rounded-lg bg-ink/10 shrink-0" aria-hidden="true" />
              )}
              <span className="flex flex-col">
                <span className="text-sm font-medium">{item.title}</span>
                <span className="text-xs text-text-secondary">{item.description}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
