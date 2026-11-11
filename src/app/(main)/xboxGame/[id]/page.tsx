'use client'

import { notFound, useParams } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useAuthSession } from '@/hooks/useAuthSession'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useXboxAchievements } from '@/hooks/useXboxAchievements'
import { useXboxGameDetails } from '@/hooks/useXboxGameDetails'
import { useXboxEnabled } from '@/hooks/useXboxEnabled'
import { isXboxTitleId, xboxBackdrop } from '@/utils/xboxTitles'
import GameInfoSkeleton from '@/components/game-info-skeleton/GameInfoSkeleton'
import GamePageNotLinked from '@/components/game-page-states/game-page-not-linked/GamePageNotLinked'
import GamePageLibraryError from '@/components/game-page-states/game-page-library-error/GamePageLibraryError'
import GameTableState from '@/components/game-page-states/game-table-state/GameTableState'
import XboxGameHeroBackground from '@/components/xbox/xbox-game-hero-background/XboxGameHeroBackground'
import XboxGameInfoHeader from '@/components/xbox/xbox-game-info-header/XboxGameInfoHeader'
import XboxGameInfoTable from '@/components/xbox/xbox-game-info-table/XboxGameInfoTable'
import XboxPartialListNote from '@/components/xbox/xbox-partial-list-note/XboxPartialListNote'
import GameAiExport from '@/components/game-ai-export/GameAiExport'
import { xboxAiSource } from '@/utils/aiExport'

/**
 * An Xbox game's page — the counterpart of /psnGame/[id], built the same way:
 * blurred artwork behind a header, then the achievements table.
 *
 * The game itself comes from the shared library, so opening it from a list
 * costs no extra request; its achievements load for the page. A game the
 * account does not have is not in that list, and is a 404; a list that could
 * not be read is not a 404, it says why and offers a retry.
 *
 * Xbox is admin-only for now: anyone else is told there is nothing here. Who
 * is looking is only known once the session is read, so a full load holds the
 * skeleton until then (it used to 404 every game, admins included).
 */
export default function XboxGamePage() {
  const { id: rawId } = useParams()
  const titleId = typeof rawId === 'string' && isXboxTitleId(rawId) ? rawId : null
  const { T } = useLanguage()
  const { status } = useAuthSession()
  const enabled = useXboxEnabled()
  const { isLinked, fullLibrary, libraryLoading, libraryError, refetch } = useXboxGamesData()
  const { achievements, isLoading, error, retry } = useXboxAchievements(isLinked ? titleId : null)
  const { details } = useXboxGameDetails(isLinked ? titleId : null)

  if (titleId === null) notFound()
  if (status === 'loading') return <GameInfoSkeleton />
  if (!enabled) notFound()
  if (!isLinked) return <GamePageNotLinked platform="Xbox" connectLabel={T.xbox.connect} />

  const game = fullLibrary.find((g) => g.titleId === titleId) ?? null
  if (!game && libraryLoading) return <GameInfoSkeleton />
  if (!game && libraryError) {
    return <GamePageLibraryError title={T.xbox.gamesError} reason={T.xbox.errors[libraryError]} retryLabel={T.xbox.retry} onRetry={refetch} />
  }
  if (!game) notFound()

  return (
    <main className="flex-1 flex flex-col items-center text-text-main relative">
      <XboxGameHeroBackground src={details?.heroUrl ?? xboxBackdrop(game)} />
      <div className="relative w-full flex flex-col items-center">
        <XboxGameInfoHeader
          game={game}
          details={details}
          actions={achievements.length > 0 && <GameAiExport getSource={() => xboxAiSource({ game, achievements, details })} />}
        />
        <GameTableState
          isLoading={isLoading}
          failed={Boolean(error)}
          errorText={T.xbox.achievementsError}
          hint={error === 'private' ? T.xbox.errors.private : null}
          retryLabel={T.xbox.retry}
          onRetry={retry}
          emptyText={T.xbox.noAchievements}
          isEmpty={achievements.length === 0}
        >
          <XboxPartialListNote game={game} listed={achievements.length} />
          <XboxGameInfoTable achievements={achievements} gameId={game.id} gameTitle={game.title} />
        </GameTableState>
      </div>
    </main>
  )
}
