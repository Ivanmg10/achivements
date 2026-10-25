'use client'

import { motion } from 'framer-motion'
import { notFound, useParams } from 'next/navigation'
import { fadeUp } from '@/lib/animations'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnGamesData } from '@/context/PsnGamesDataContext'
import { usePsnTrophies } from '@/hooks/usePsnTrophies'
import { usePsnGameDetails } from '@/hooks/usePsnGameDetails'
import { isPsnTitleId, psnBackdrop } from '@/utils/psnTitles'
import GameInfoSkeleton from '@/components/game-info-skeleton/GameInfoSkeleton'
import GameInfoSkeletonTable from '@/components/game-info-skeleton/game-info-skeleton-table/GameInfoSkeletonTable'
import PsnGameHeroBackground from '@/components/psn/psn-game-hero-background/PsnGameHeroBackground'
import PsnGameInfoHeader from '@/components/psn/psn-game-info-header/PsnGameInfoHeader'
import PsnGameInfoTable from '@/components/psn/psn-game-info-table/PsnGameInfoTable'
import GameAiExport from '@/components/game-ai-export/GameAiExport'
import { psnAiSource } from '@/utils/aiExport'
import Button from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/Button'

/**
 * A PSN game's page — the counterpart of /steamGame/[appId], built the same
 * way: blurred artwork behind a header, then the trophy table.
 *
 * The game itself comes from the shared trophy list, so opening it from a
 * list costs no extra request; its trophies load for the page. A game the
 * account has never played is not in that list, and is a 404 — Sony has
 * nothing of theirs to show for it.
 */
export default function PsnGamePage() {
  const { id: rawId } = useParams()
  const titleId = typeof rawId === 'string' && isPsnTitleId(rawId) ? rawId : null
  const { T } = useLanguage()
  const { isLinked, fullLibrary, libraryLoading } = usePsnGamesData()
  const { trophies, groups, isLoading, error, retry } = usePsnTrophies(isLinked ? titleId : null)
  const { details } = usePsnGameDetails(isLinked ? titleId : null)

  if (titleId === null) notFound()

  if (!isLinked) {
    return (
      <main className="flex-1 flex flex-col justify-center items-center text-text-main gap-3 p-6 text-center">
        <p className="text-text-secondary">PlayStation Network · {T.userData.notConnected}</p>
        <Button
          href="/user"
          size="sm"
        >
          {T.psn.connect}
        </Button>
      </main>
    )
  }

  const game = fullLibrary.find((g) => g.titleId === titleId) ?? null
  if (!game && libraryLoading) return <GameInfoSkeleton />
  if (!game) notFound()

  return (
    <main className="flex-1 flex flex-col items-center text-text-main relative">
      <PsnGameHeroBackground src={psnBackdrop(game)} />
      <motion.div className="relative w-full flex flex-col items-center" variants={fadeUp} initial="hidden" animate="visible">
        <PsnGameInfoHeader
          game={game}
          details={details}
          actions={trophies.length > 0 && <GameAiExport getSource={() => psnAiSource({ game, trophies, groups, details })} />}
        />

        {isLoading ? (
          <div role="status" aria-busy="true" className="w-full flex flex-col items-center">
            <span className="sr-only">{T.loadingPage.game}</span>
            <GameInfoSkeletonTable />
          </div>
        ) : error ? (
          <section className="bg-bg-card rounded-card ring-1 ring-ink/[0.06] p-6 w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] lg:w-[calc(100%-7rem)] mt-7 mb-5 flex flex-col items-center gap-2 text-center">
            <p role="alert" className="text-danger">
              {T.psn.trophiesError}
            </p>
            {error === 'private' && <p className="text-xs text-text-secondary">{T.psn.errors.private}</p>}
            <button onClick={retry} className={buttonClass('secondary', 'sm')}>
              {T.psn.retry}
            </button>
          </section>
        ) : trophies.length === 0 ? (
          <section className="bg-bg-card rounded-card ring-1 ring-ink/[0.06] p-6 w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] lg:w-[calc(100%-7rem)] mt-7 mb-5 text-center">
            <p className="text-text-secondary">{T.psn.noTrophies}</p>
          </section>
        ) : (
          <PsnGameInfoTable trophies={trophies} groups={groups} gameId={game.id} gameTitle={game.title} />
        )}
      </motion.div>
    </main>
  )
}
