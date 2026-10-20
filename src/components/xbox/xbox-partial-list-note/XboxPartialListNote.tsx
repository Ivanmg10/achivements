'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { XboxGameProgress } from '@/types/xbox'

/**
 * Xbox 360 games list only the achievements that were unlocked (OpenXBL has
 * no call for the locked ones), so a "14 of 50" game shows 14. Say so instead
 * of leaving the missing ones looking like a bug.
 */
export default function XboxPartialListNote({ game, listed }: { game: XboxGameProgress; listed: number }) {
  const { T } = useLanguage()
  if (!game.totalKnown || listed >= game.maxPossible) return null
  return (
    <p role="status" className="text-xs text-text-secondary mb-2">
      {T.xbox.partialList}
    </p>
  )
}
