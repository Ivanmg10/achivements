'use client'

import { ReactNode, useEffect, useId, useState } from 'react'
import { IconChevronDown } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import ExpandPanel from '@/components/expand-panel/ExpandPanel'

/**
 * A titled section that folds away, so a long list above does not have to be
 * scrolled past to reach the one below (the RA and Steam lists on a category
 * page). Starts folded; folded, it shows `preview` — a few of its games — and
 * a button inviting to open the whole list.
 *
 * With a `storageKey` it stays open for the rest of the browser session (so
 * going to a game and back keeps it open), but every new visit starts folded.
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
  defaultOpen = false,
  preview,
  className = '',
  children,
}: {
  title: string
  icon?: ReactNode
  /** Shown beside the title; omit while loading. */
  count?: number
  storageKey?: string
  defaultOpen?: boolean
  /** Shown while folded, above the "show all" button. */
  preview?: ReactNode
  className?: string
  children: ReactNode
}) {
  const { T } = useLanguage()
  const [open, setOpen] = useState(defaultOpen)
  const titleId = useId()
  const panelId = useId()

  // Read after mount, not during render, so server and client render the same.
  useEffect(() => {
    if (!storageKey) return
    try {
      const saved = window.sessionStorage.getItem(storageKey)
      if (saved === 'open' || saved === 'closed') setOpen(saved === 'open')
    } catch {
      // Storage unavailable (private mode, blocked): keep the default.
    }
  }, [storageKey])

  function setAndRemember(next: boolean) {
    setOpen(next)
    if (!storageKey) return
    try {
      window.sessionStorage.setItem(storageKey, next ? 'open' : 'closed')
    } catch {
      // Not remembered — the toggle itself still works.
    }
  }

  const showAllLabel = count !== undefined ? T.categoryPage.showAllGames.replace('{n}', String(count)) : T.categoryPage.showAll

  return (
    <section
      aria-labelledby={titleId}
      className={`w-full flex flex-col rounded-2xl border border-white/5 bg-bg-header/70 p-3 sm:p-4 ${className}`}
    >
      <h2 className="text-lg sm:text-xl font-bold">
        <button
          onClick={() => setAndRemember(!open)}
          aria-expanded={open}
          aria-controls={panelId}
          className="group w-full flex items-center gap-2.5 text-left rounded-xl px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          {icon}
          <span id={titleId}>{title}</span>
          {count !== undefined && (
            <span className="text-xs font-semibold text-text-secondary tabular-nums bg-white/5 rounded-full px-2 py-0.5">
              {count}
            </span>
          )}
          <span
            aria-hidden="true"
            className="ml-auto flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-text-secondary group-hover:bg-white/10 group-hover:text-text-main transition-colors"
          >
            <IconChevronDown size={18} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
          </span>
        </button>
      </h2>

      {/* The list slides open while the preview slides shut, and back. */}
      <ExpandPanel open={open} id={panelId}>
        <div className="flex flex-col gap-3 pt-3">{children}</div>
      </ExpandPanel>
      <ExpandPanel open={!open}>
        <div className="flex flex-col gap-3 pt-3">
          {preview}
          <button
            onClick={() => setAndRemember(true)}
            className="self-center flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-text-secondary hover:text-text-main hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {showAllLabel}
            <IconChevronDown size={14} aria-hidden="true" />
          </button>
        </div>
      </ExpandPanel>
    </section>
  )
}
