'use client'

import type { ReactNode } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import Button from '@/components/ui/Button'
import GameTableLoading from '@/components/game-page-states/game-table-loading/GameTableLoading'
import { GAME_SECTION_WIDTH } from '@/components/game-page-states/gameSectionWidth'

/**
 * A game as a user has it, the same on every platform: the blurred art, your banner on top, the
 * platform's header, then under it a skeleton while their list loads, why it could not be read (with
 * a retry), or the comparison (the children).
 */
export default function UserGameCompareBody({
  background,
  banner,
  header,
  username,
  isLoading = false,
  failed = false,
  hint,
  onRetry,
  children,
}: {
  background: ReactNode
  banner: ReactNode
  header: ReactNode
  username: string
  isLoading?: boolean
  failed?: boolean
  /** A second line under the error (a private profile and how to fix it). */
  hint?: string | null
  onRetry?: () => void
  children: ReactNode
}) {
  const { T } = useLanguage()
  return (
    <>
      {background}
      {banner}
      <div className="relative w-full flex flex-col items-center">
        {header}
        <div className={`${GAME_SECTION_WIDTH} mt-7 mb-7`}>
          {isLoading ? (
            <GameTableLoading />
          ) : failed ? (
            <section className="bg-bg-card p-5 rounded-tile flex flex-col items-center gap-2 text-center">
              <p role="alert" className="text-danger">{T.userGame.loadError.replace('{u}', username)}</p>
              {hint && <p className="text-xs text-text-secondary">{hint}</p>}
              <Button variant="secondary" size="sm" onClick={onRetry}>
                {T.publicProfile.retry}
              </Button>
            </section>
          ) : (
            children
          )}
        </div>
      </div>
    </>
  )
}
