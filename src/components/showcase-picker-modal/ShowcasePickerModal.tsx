'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { IconSearch, IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useActivityHeatmapYear } from '@/context/ActivityHeatmapYearContext'
import { useOwnShowcase } from '@/context/ShowcaseContext'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { modalContent, modalOverlay } from '@/lib/animations'
import { normalizeTitle } from '@/utils/gameCandidates'
import { showcaseFromUnlock, showcaseKey, type ShowcaseEntry } from '@/utils/showcase'
import ShowcasePickerModalRow from './showcase-picker-modal-row/ShowcasePickerModalRow'

/** ponytail: a long year renders this many at most; the search narrows it. */
const SHOWN_MAX = 120

/**
 * Picks achievements for the showcase from what the user earned in the last
 * year, on every platform (the same unlocks behind the streak): newest first,
 * searchable by name or game. It stays open, so several can go in at once.
 * Older ones are added from their game page.
 */
export default function ShowcasePickerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { T } = useLanguage()
  const { achievements } = useActivityHeatmapYear()
  const showcase = useOwnShowcase()
  const [query, setQuery] = useState('')
  const titleId = useId()
  const searchId = useId()

  // Opening starts it over; state, so while rendering.
  useWhenChanged([isOpen], () => {
    if (isOpen) setQuery('')
  })

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const entries = useMemo(() => {
    const seen = new Set<string>()
    return achievements
      .map(showcaseFromUnlock)
      .filter((e): e is ShowcaseEntry => {
        if (!e || seen.has(showcaseKey(e))) return false
        seen.add(showcaseKey(e))
        return true
      })
      .sort((a, b) => b.earnedAt.localeCompare(a.earnedAt))
  }, [achievements])

  const shown = useMemo(() => {
    const q = normalizeTitle(query.trim())
    const matches = q ? entries.filter((e) => normalizeTitle(e.title).includes(q) || normalizeTitle(e.gameTitle).includes(q)) : entries
    return matches.slice(0, SHOWN_MAX)
  }, [entries, query])

  return (
    <AnimatePresence>
      {isOpen && showcase && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="bg-bg-main rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 p-5 border-b border-bg-header">
              <div className="flex flex-col gap-1 min-w-0">
                <h2 id={titleId} className="text-lg font-semibold">{T.showcase.pickerTitle}</h2>
                <p className="text-xs text-text-secondary">
                  {T.showcase.count.replace('{n}', String(showcase.items.length))} · {T.showcase.pickerHint}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={T.toast.close}
                className="p-1 rounded-lg text-text-secondary hover:text-text-main transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                <IconX size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="p-3 border-b border-bg-header">
              <label htmlFor={searchId} className="sr-only">{T.showcase.pickerSearch}</label>
              <div className="relative">
                <IconSearch size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  id={searchId}
                  type="search"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={T.showcase.pickerSearch}
                  className="w-full bg-bg-card rounded-xl pl-9 pr-3 py-2 text-sm placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                />
              </div>
            </div>

            <div className="overflow-y-auto overscroll-contain p-2">
              {entries.length === 0 ? (
                <p className="py-10 text-center text-sm text-text-secondary">{T.showcase.pickerNone}</p>
              ) : shown.length === 0 ? (
                <p role="status" className="py-10 text-center text-sm text-text-secondary">{T.showcase.pickerNoMatch}</p>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {shown.map((entry) => (
                    <li key={showcaseKey(entry)}>
                      <ShowcasePickerModalRow
                        entry={entry}
                        inShowcase={showcase.has(entry)}
                        disabled={showcase.full}
                        onPick={() => showcase.add(entry)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
