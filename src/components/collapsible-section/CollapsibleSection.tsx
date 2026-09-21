'use client'

import { ReactNode, useEffect, useId, useState } from 'react'
import { IconChevronDown } from '@tabler/icons-react'

/**
 * A titled section that folds away, so a long list above does not have to be
 * scrolled past to reach the one below (the RA and Steam lists on a category
 * page). Remembers its state per `storageKey` in this browser.
 *
 * The body unmounts when closed rather than being hidden: the lists inside use
 * a masonry layout that measures its items, which a display:none subtree
 * cannot give it.
 */
export default function CollapsibleSection({
  title,
  icon,
  count,
  storageKey,
  defaultOpen = true,
  className = '',
  children,
}: {
  title: string
  icon?: ReactNode
  /** Shown beside the title; omit while loading. */
  count?: number
  storageKey?: string
  defaultOpen?: boolean
  className?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const titleId = useId()
  const panelId = useId()

  // Read after mount, not during render, so server and client render the same.
  useEffect(() => {
    if (!storageKey) return
    try {
      const saved = window.localStorage.getItem(storageKey)
      if (saved === 'open' || saved === 'closed') setOpen(saved === 'open')
    } catch {
      // Storage unavailable (private mode, blocked): keep the default.
    }
  }, [storageKey])

  function toggle() {
    setOpen((o) => {
      const next = !o
      if (storageKey) {
        try {
          window.localStorage.setItem(storageKey, next ? 'open' : 'closed')
        } catch {
          // Not remembered — the toggle itself still works.
        }
      }
      return next
    })
  }

  return (
    <section aria-labelledby={titleId} className={`flex flex-col gap-3 w-full ${className}`}>
      <h2 className="text-xl font-bold">
        <button
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="w-full flex items-center gap-2 text-left rounded-lg py-1 hover:text-text-main/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          {icon}
          <span id={titleId}>{title}</span>
          {count !== undefined && (
            <span className="text-sm font-normal text-text-secondary tabular-nums">{count}</span>
          )}
          <IconChevronDown
            size={18}
            aria-hidden="true"
            className={`ml-auto shrink-0 text-text-secondary transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </h2>
      {open && (
        <div id={panelId} className="flex flex-col gap-3">
          {children}
        </div>
      )}
    </section>
  )
}
