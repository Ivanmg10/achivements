'use client'

import { notFound, useParams } from 'next/navigation'
import { GAME_COLUMN } from '@/components/game-page-states/gameSectionWidth'
import { useLanguage } from '@/context/LanguageContext'
import { useAuthSession } from '@/hooks/useAuthSession'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { usePsnTrophies } from '@/hooks/usePsnTrophies'
import { usePsnGameDetails } from '@/hooks/usePsnGameDetails'
import { isPsnTitleId, psnBackdrop } from '@/utils/psnTitles'
import GameInfoSkeleton from '@/components/game-info-skeleton/GameInfoSkeleton'
import GamePageNotLinked from '@/components/game-page-states/game-page-not-linked/GamePageNotLinked'
import GamePageLibraryError from '@/components/game-page-states/game-page-library-error/GamePageLibraryError'
import GameTableState from '@/components/game-page-states/game-table-state/GameTableState'
import PsnGameHeroBackground from '@/components/psn/psn-game-hero-background/PsnGameHeroBackground'
import PsnGameInfoHeader from '@/components/psn/psn-game-info-header/PsnGameInfoHeader'
import PsnGameInfoTable from '@/components/psn/psn-game-info-table/PsnGameInfoTable'
import GameAiExport from '@/components/game-ai-export/GameAiExport'
import { psnAiSource } from '@/utils/aiExport'

/**
 * A PSN game's page — the counterpart of /steamGame/[appId], built the same
 * way: blurred artwork behind a header, then the trophy table.
 *
 * The game itself comes from the shared trophy list, so opening it from a
 * list costs no extra request; its trophies load for the page. A game the
 * account has never played is not in that list, and is a 404 — Sony has
 * nothing of theirs to show for it; a list that could not be read is not a
 * 404, it says why and offers a retry.
 */
export default function PsnGamePage() {
  const { id: rawId } = useParams()
  const titleId = typeof rawId === 'string' && isPsnTitleId(rawId) ? rawId : null
  const { T } = useLanguage()
  const { status } = useAuthSession()
  const { isLinked, fullLibrary, libraryLoading, libraryError, refetch } = usePsnGamesData()
  const { trophies, groups, isLoading, error, retry } = usePsnTrophies(isLinked ? titleId : null)
  const { details } = usePsnGameDetails(isLinked ? titleId : null)

  if (titleId === null) notFound()
  if (status === 'loading') return <GameInfoSkeleton />
  if (!isLinked) return <GamePageNotLinked platform="PlayStation Network" connectLabel={T.psn.connect} />

  const game = fullLibrary.find((g) => g.titleId === titleId) ?? null
  if (!game && libraryLoading) return <GameInfoSkeleton />
  if (!game && libraryError) {
    return <GamePageLibraryError title={T.psn.gamesError} reason={T.psn.errors[libraryError]} retryLabel={T.psn.retry} onRetry={refetch} />
  }
  if (!game) notFound()

  return (
    <main className="flex-1 flex flex-col items-center text-text-main relative">
      <PsnGameHeroBackground src={psnBackdrop(game)} />
      <div className={GAME_COLUMN}>
        <PsnGameInfoHeader
          game={game}
          details={details}
          actions={trophies.length > 0 && <GameAiExport getSource={() => psnAiSource({ game, trophies, groups, details })} />}
        />
        <GameTableState
          isLoading={isLoading}
          failed={Boolean(error)}
          errorText={T.psn.trophiesError}
          hint={error === 'private' ? T.psn.errors.private : null}
          retryLabel={T.psn.retry}
          onRetry={retry}
          emptyText={T.psn.noTrophies}
          isEmpty={trophies.length === 0}
        >
          <PsnGameInfoTable trophies={trophies} groups={groups} gameId={game.id} gameTitle={game.title} />
        </GameTableState>
      </div>
    </main>
  )
}
