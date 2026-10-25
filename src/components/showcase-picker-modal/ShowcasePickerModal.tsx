'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { IconArrowLeft, IconX } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useActivityHeatmapYear } from '@/context/ActivityHeatmapYearContext'
import { useOwnShowcase } from '@/context/ShowcaseContext'
import { useProfileLibrary } from '@/hooks/useProfileLibrary'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { gameKey } from '@/utils/gameRef'
import type { LibraryGame } from '@/utils/library'
import { SHOWCASE_MAX, showcaseKey, type ShowcaseEntry } from '@/utils/showcase'
import ShowcasePickerModalGames from './showcase-picker-modal-games/ShowcasePickerModalGames'
import ShowcasePickerModalGame from './showcase-picker-modal-game/ShowcasePickerModalGame'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

/**
 * Picks achievements for the showcase: first the user's games with something
 * earned (those played this year first), then a game's achievements, earned
 * ones selectable and the rest greyed, with a way back to the games. The
 * selection spans games — games holding selected achievements stand out — and
 * goes into the showcase all at once, never more than fits.
 */
export default function ShowcasePickerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { T } = useLanguage()
  const showcase = useOwnShowcase()
  const { games, isLoading } = useProfileLibrary()
  const { achievements: year } = useActivityHeatmapYear()
  const [game, setGame] = useState<LibraryGame | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ShowcaseEntry[]>([])
  const [saving, setSaving] = useState(false)
  const titleId = useId()

  // Opening starts it over; state, so while rendering.
  useWhenChanged([isOpen], () => {
    if (isOpen) {
      setGame(null)
      setQuery('')
      setSelected([])
      setSaving(false)
    }
  })

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Games with something earned; the ones with an unlock this year first, latest first, then by name.
  const withEarned = useMemo(() => {
    const latest = new Map<string, string>()
    for (const a of year) {
      const k = gameKey(a.Source ?? 'ra', a.GameID)
      if ((latest.get(k) ?? '') < a.Date) latest.set(k, a.Date)
    }
    return games
      .filter((g) => g.pct > 0)
      .sort((a, b) => (latest.get(b.key) ?? '').localeCompare(latest.get(a.key) ?? '') || a.title.localeCompare(b.title))
  }, [games, year])

  const free = Math.max(0, SHOWCASE_MAX - (showcase?.items.length ?? 0))
  const keys = useMemo(() => new Set(selected.map(showcaseKey)), [selected])
  const perGame = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of selected) counts.set(gameKey(e.source, e.gameId), (counts.get(gameKey(e.source, e.gameId)) ?? 0) + 1)
    return counts
  }, [selected])

  function toggle(entry: ShowcaseEntry) {
    const k = showcaseKey(entry)
    setSelected((prev) => (prev.some((e) => showcaseKey(e) === k) ? prev.filter((e) => showcaseKey(e) !== k) : prev.length < free ? [...prev, entry] : prev))
  }

  async function save() {
    if (!showcase || selected.length === 0) return
    setSaving(true)
    await showcase.addMany(selected)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && showcase && (
        <Modal isOpen={isOpen} onClose={onClose} aria-labelledby={titleId} size="md" showClose={false} className="gap-4">
            <div className="flex items-start justify-between gap-3 p-5 border-b border-bg-header">
              <div className="flex flex-col gap-1 min-w-0">
                {game && (
                  <button
                    type="button"
                    onClick={() => setGame(null)}
                    className="self-start flex items-center gap-1 text-xs text-text-secondary hover:text-text-main rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                  >
                    <IconArrowLeft size={14} aria-hidden="true" />
                    {T.showcase.back}
                  </button>
                )}
                <h2 id={titleId} className="text-lg font-semibold truncate">{game ? game.title : T.showcase.pickerTitle}</h2>
                {!game && <p className="text-xs text-text-secondary">{T.showcase.pickerHint}</p>}
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

            {game ? (
              <ShowcasePickerModalGame
                game={game}
                isSelected={(e) => keys.has(showcaseKey(e))}
                inShowcase={(e) => showcase.has(e)}
                blocked={selected.length >= free}
                onToggle={toggle}
              />
            ) : (
              <ShowcasePickerModalGames
                games={withEarned}
                isLoading={isLoading}
                query={query}
                onQuery={setQuery}
                selectedIn={(k) => perGame.get(k) ?? 0}
                onOpen={setGame}
              />
            )}

            <div className="flex items-center justify-between gap-3 p-4 border-t border-bg-header">
              <p role="status" className="text-xs text-text-secondary tabular-nums">
                {T.showcase.selected.replace('{n}', String(selected.length))} ·{' '}
                {free - selected.length > 0 ? T.showcase.slotsLeft.replace('{n}', String(free - selected.length)) : T.showcase.noSlots}
              </p>
              <Button
                type="button"
                onClick={save}
                disabled={selected.length === 0 || saving}
                className="shrink-0"
              >
                {T.showcase.addSelected}
              </Button>
            </div>
          </Modal>
      )}
    </AnimatePresence>
  )
}
