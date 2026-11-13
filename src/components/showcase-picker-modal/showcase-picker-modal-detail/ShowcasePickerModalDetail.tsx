'use client'

import { IconArrowLeft, IconTrophy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { LibraryGame } from '@/utils/library'
import type { ShowcaseEntry } from '@/utils/showcase'
import ShowcasePickerModalGame from '../showcase-picker-modal-game/ShowcasePickerModalGame'

/**
 * The picker's right pane: the open game's achievements under its title, or, before one is chosen, what to do.
 * Below `lg` the pane is a step of its own, with the way back to the games.
 */
export default function ShowcasePickerModalDetail({
  game,
  isSelected,
  inShowcase,
  blocked,
  onToggle,
  onBack,
}: {
  game: LibraryGame | null
  isSelected: (entry: ShowcaseEntry) => boolean
  inShowcase: (entry: ShowcaseEntry) => boolean
  blocked: boolean
  onToggle: (entry: ShowcaseEntry) => void
  onBack: () => void
}) {
  const { T } = useLanguage()

  if (!game) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center rounded-card bg-bg-main/60 ring-1 ring-ink/[0.06] p-8">
        <IconTrophy size={32} aria-hidden="true" className="text-text-secondary" />
        <p className="font-semibold">{T.showcase.pickGame}</p>
        <p className="text-sm text-text-secondary max-w-xs">{T.showcase.pickGameHint}</p>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="lg:hidden self-start flex items-center gap-1 text-xs text-text-secondary hover:text-text-main rounded focus-ring"
      >
        <IconArrowLeft size={14} aria-hidden="true" />
        {T.showcase.back}
      </button>
      <h3 className="text-base font-bold leading-snug wrap-break-word">{game.title}</h3>
      <ShowcasePickerModalGame game={game} isSelected={isSelected} inShowcase={inShowcase} blocked={blocked} onToggle={onToggle} />
    </>
  )
}
