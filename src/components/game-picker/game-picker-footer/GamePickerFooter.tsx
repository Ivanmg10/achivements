'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { GameCandidate } from '@/utils/gameCandidates'
import GamePickerChip from '@/components/game-picker/game-picker-chip/GamePickerChip'
import Button from '@/components/ui/Button'

/**
 * The footer of the multi-pick game picker: what is picked as chips (always in view, never at the end of the
 * scroll), how many, a way to clear them, and the one button that confirms them all.
 */
export default function GamePickerFooter({
  picked,
  onRemove,
  onClear,
  onConfirm,
  confirmLabel,
  pickPrompt,
  error,
  saving,
}: {
  picked: GameCandidate[]
  onRemove: (game: GameCandidate) => void
  onClear: () => void
  onConfirm: () => void
  confirmLabel: (count: number) => string
  pickPrompt: string
  error?: string
  saving: boolean
}) {
  const { T } = useLanguage()
  return (
    <div className="w-full flex flex-col gap-2">
      {picked.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {picked.map((c) => (
            <GamePickerChip key={c.key} candidate={c} removeLabel={`${T.groups.removeGame} ${c.title}`} onRemove={() => onRemove(c)} />
          ))}
        </div>
      )}
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      <div className="flex items-center gap-3">
        <p role="status" className="text-xs text-text-secondary flex-1 min-w-0">
          {picked.length > 0 ? T.groups.selectedCount.replace('{n}', String(picked.length)) : pickPrompt}
        </p>
        {picked.length > 0 && <Button variant="quiet" size="sm" onClick={onClear}>{T.groups.clearSelection}</Button>}
        <Button onClick={onConfirm} loading={saving} disabled={picked.length === 0}>{confirmLabel(picked.length)}</Button>
      </div>
    </div>
  )
}
