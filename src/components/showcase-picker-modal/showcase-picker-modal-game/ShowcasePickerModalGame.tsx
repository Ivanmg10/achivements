'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useShowcaseGameChoices } from '@/hooks/useShowcaseGameChoices'
import type { LibraryGame } from '@/utils/library'
import type { ShowcaseEntry } from '@/utils/showcase'
import ShowcasePickerModalAchievement from '../showcase-picker-modal-achievement/ShowcasePickerModalAchievement'

/**
 * The picker's second view: every achievement of one game, the earned ones
 * first and selectable, the rest greyed. What is selected here stays selected
 * when going back to the games.
 */
export default function ShowcasePickerModalGame({
  game,
  isSelected,
  inShowcase,
  blocked,
  onToggle,
}: {
  game: LibraryGame
  isSelected: (entry: ShowcaseEntry) => boolean
  inShowcase: (entry: ShowcaseEntry) => boolean
  /** Nothing more fits: only what is selected can still be clicked (to unselect it). */
  blocked: boolean
  onToggle: (entry: ShowcaseEntry) => void
}) {
  const { T } = useLanguage()
  const { choices, isLoading, error, retry } = useShowcaseGameChoices(game)
  const earned = choices.filter((c) => c.entry).length

  return (
    <div className="overflow-y-auto overscroll-contain p-3 flex-1 flex flex-col gap-3">
      {isLoading ? (
        <div aria-busy="true" className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-28 rounded-xl bg-bg-card animate-pulse motion-reduce:animate-none" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <p role="alert" className="text-sm text-danger">{T.showcase.gameError}</p>
          <button
            type="button"
            onClick={retry}
            className="text-sm text-accent hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {T.publicProfile.retry}
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs text-text-secondary tabular-nums">
            {T.showcase.earnedOf.replace('{n}', String(earned)).replace('{total}', String(choices.length))}
          </p>
          <ul aria-label={T.showcase.achievementsLabel} className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {choices.map((choice) => (
              <li key={choice.key}>
                <ShowcasePickerModalAchievement
                  choice={choice}
                  selected={choice.entry ? isSelected(choice.entry) : false}
                  inShowcase={choice.entry ? inShowcase(choice.entry) : false}
                  blocked={blocked}
                  onToggle={() => choice.entry && onToggle(choice.entry)}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
