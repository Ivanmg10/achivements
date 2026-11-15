'use client'

import type { ReactNode } from 'react'
import Button from '@/components/ui/Button'
import { SURFACE } from '@/components/ui/surface'
import GameTableLoading from '@/components/game-page-states/game-table-loading/GameTableLoading'
import { GAME_SECTION_WIDTH } from '@/components/game-page-states/gameSectionWidth'

const CARD = `${SURFACE} p-6 ${GAME_SECTION_WIDTH} mt-7 mb-5`

/**
 * What a game page puts under its header: the table's skeleton while its achievements load, why they
 * could not be read (with a retry), a line when the game has none, or the table itself (the children).
 */
export default function GameTableState({
  isLoading,
  failed,
  errorText,
  hint,
  retryLabel,
  onRetry,
  emptyText,
  isEmpty,
  children,
}: {
  isLoading: boolean
  failed: boolean
  errorText: string
  /** A second line under the error (a private profile and how to fix it). */
  hint?: string | null
  retryLabel: string
  onRetry: () => void
  emptyText: string
  isEmpty: boolean
  children: ReactNode
}) {
  if (isLoading) return <GameTableLoading />
  if (failed) {
    return (
      <section className={`${CARD} flex flex-col items-center gap-2 text-center`}>
        <p role="alert" className="text-danger">
          {errorText}
        </p>
        {hint && <p className="text-xs text-text-secondary">{hint}</p>}
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      </section>
    )
  }
  if (isEmpty) {
    return (
      <section className={`${CARD} text-center`}>
        <p className="text-text-secondary">{emptyText}</p>
      </section>
    )
  }
  return <>{children}</>
}
