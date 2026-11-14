'use client'

import { useMemo, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useActivityHeatmapYear } from '@/context/ActivityHeatmapYearContext'
import { useOwnShowcase } from '@/context/ShowcaseContext'
import { useProfileLibrary } from '@/hooks/useProfileLibrary'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { gameKey, GAME_SOURCES } from '@/utils/gameRef'
import type { LibraryGame } from '@/utils/library'
import { SHOWCASE_MAX, showcaseKey, type ShowcaseEntry } from '@/utils/showcase'
import ShowcasePickerModalGames from './showcase-picker-modal-games/ShowcasePickerModalGames'
import ShowcasePickerModalFilters, { type ShowcasePlatform } from './showcase-picker-modal-filters/ShowcasePickerModalFilters'
import ShowcasePickerModalDetail from './showcase-picker-modal-detail/ShowcasePickerModalDetail'
import ShowcasePickerModalSlots from './showcase-picker-modal-slots/ShowcasePickerModalSlots'
import Button from '@/components/ui/Button'
import Facts from '@/components/ui/Facts'
import Modal from '@/components/ui/Modal'

/**
 * Picks achievements for the showcase. From `lg` two panes: the user's games with something earned (those played
 * this year first) as rows, and the chosen game's achievements, earned ones selectable and the rest greyed. Below
 * `lg`, the same as steps (games, then a game's achievements, with a way back). The footer draws the showcase's
 * places: what it holds, what is picked and what is left. The selection spans games, games holding selected
 * achievements stand out, and it goes into the showcase all at once, never more than fits.
 */
export default function ShowcasePickerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { T } = useLanguage()
  const showcase = useOwnShowcase()
  const { games, isLoading } = useProfileLibrary()
  const { achievements: year } = useActivityHeatmapYear()
  const [game, setGame] = useState<LibraryGame | null>(null)
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState<ShowcasePlatform>('all')
  const [selected, setSelected] = useState<ShowcaseEntry[]>([])
  const [saving, setSaving] = useState(false)

  // Opening starts it over; state, so while rendering.
  useWhenChanged([isOpen], () => {
    if (isOpen) {
      setGame(null)
      setQuery('')
      setPlatform('all')
      setSelected([])
      setSaving(false)
    }
  })

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

  const counts = useMemo(
    () => GAME_SOURCES.map((s) => [s, withEarned.filter((g) => g.source === s).length] as [typeof s, number]).filter(([, n]) => n > 0),
    [withEarned],
  )

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
    <Modal
      isOpen={isOpen && !!showcase}
      onClose={onClose}
      size="xl"
      title={T.showcase.pickerTitle}
      hint={T.showcase.pickerHint}
      className="gap-4"
      toolbar={<ShowcasePickerModalFilters isLoading={isLoading} query={query} onQuery={setQuery} platform={platform} onPlatform={setPlatform} counts={counts} />}
      footer={
        <>
          <ShowcasePickerModalSlots taken={showcase?.items ?? []} picked={selected} onRemove={toggle} onBrowse={() => setGame(null)} />
          <p role="status" className="text-xs text-text-secondary tabular-nums">
            <Facts
              items={[
                T.showcase.selected.replace('{n}', String(selected.length)),
                free - selected.length > 0 ? T.showcase.slotsLeft.replace('{n}', String(free - selected.length)) : T.showcase.noSlots,
              ]}
            />
          </p>
          <Button type="button" onClick={save} disabled={selected.length === 0 || saving} className="shrink-0">
            {T.showcase.addSelected}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:h-[max(16rem,calc(85dvh-19rem))]">
        <div className={`${game ? 'hidden lg:flex' : 'flex'} flex-col gap-3 min-w-0 lg:min-h-0`}>
          <ShowcasePickerModalGames
            games={withEarned}
            isLoading={isLoading}
            query={query}
            platform={platform}
            selectedIn={(k) => perGame.get(k) ?? 0}
            openKey={game?.key}
            onOpen={setGame}
          />
        </div>
        <div className={`${game ? 'flex' : 'hidden lg:flex'} flex-col gap-3 min-w-0 lg:min-h-0 lg:pl-4 lg:shadow-hairline-l`}>
          <ShowcasePickerModalDetail
            game={game}
            isSelected={(e) => keys.has(showcaseKey(e))}
            inShowcase={(e) => showcase?.has(e) ?? false}
            blocked={selected.length >= free}
            onToggle={toggle}
            onBack={() => setGame(null)}
          />
        </div>
      </div>
    </Modal>
  )
}
