'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { notFound, useParams } from 'next/navigation'
import { fadeUp } from '@/lib/animations'
import { useLanguage } from '@/context/LanguageContext'
import { useXboxGamesData } from '@/context/XboxGamesDataContext'
import { useXboxAchievements } from '@/hooks/useXboxAchievements'
import { useXboxGameDetails } from '@/hooks/useXboxGameDetails'
import { useXboxEnabled } from '@/hooks/useXboxEnabled'
import { isXboxTitleId, xboxBackdrop } from '@/utils/xboxTitles'
import GameInfoSkeleton from '@/components/game-info-skeleton/GameInfoSkeleton'
import GameInfoSkeletonTable from '@/components/game-info-skeleton/game-info-skeleton-table/GameInfoSkeletonTable'
import XboxGameHeroBackground from '@/components/xbox/xbox-game-hero-background/XboxGameHeroBackground'
import XboxGameInfoHeader from '@/components/xbox/xbox-game-info-header/XboxGameInfoHeader'
import XboxGameInfoTable from '@/components/xbox/xbox-game-info-table/XboxGameInfoTable'
import GameAiExport from '@/components/game-ai-export/GameAiExport'
import { xboxAiSource } from '@/utils/aiExport'

/**
 * An Xbox game's page — the counterpart of /psnGame/[id], built the same way:
 * blurred artwork behind a header, then the achievements table.
 *
 * The game itself comes from the shared library, so opening it from a list
 * costs no extra request; its achievements load for the page. A game the
 * account does not have is not in that list, and is a 404.
 *
 * Xbox is admin-only for now: anyone else is told there is nothing here.
 */
export default function XboxGamePage() {
  const { id: rawId } = useParams()
  const titleId = typeof rawId === 'string' && isXboxTitleId(rawId) ? rawId : null
  const { T } = useLanguage()
  const enabled = useXboxEnabled()
  const { isLinked, library, libraryLoading } = useXboxGamesData()
  const { achievements, isLoading, error, retry } = useXboxAchievements(isLinked ? titleId : null)
  const { details } = useXboxGameDetails(isLinked ? titleId : null)

  if (titleId === null || !enabled) notFound()

  if (!isLinked) {
    return (
      <main className="flex-1 flex flex-col justify-center items-center text-text-main gap-3 p-6 text-center">
        <p className="text-text-secondary">Xbox · {T.userData.notConnected}</p>
        <Link
          href="/user"
          className="px-4 py-1.5 bg-accent text-bg-main font-semibold rounded-xl hover:scale-[1.03] transition-transform duration-200 text-sm"
        >
          {T.xbox.connect}
        </Link>
      </main>
    )
  }

  const game = library.find((g) => g.titleId === titleId) ?? null
  if (!game && libraryLoading) return <GameInfoSkeleton />
  if (!game) notFound()

  return (
    <main className="flex-1 flex flex-col items-center text-text-main relative">
      <XboxGameHeroBackground src={xboxBackdrop(game)} />
      <motion.div className="relative w-full flex flex-col items-center" variants={fadeUp} initial="hidden" animate="visible">
        <XboxGameInfoHeader
          game={game}
          details={details}
          actions={achievements.length > 0 && <GameAiExport getSource={() => xboxAiSource({ game, achievements, details })} />}
        />

        {isLoading ? (
          <div role="status" aria-busy="true" className="w-full flex flex-col items-center">
            <span className="sr-only">{T.loadingPage.game}</span>
            <GameInfoSkeletonTable />
          </div>
        ) : error ? (
          <section className="bg-bg-card p-5 rounded-xl w-[95%] mt-5 mb-5 flex flex-col items-center gap-2 text-center">
            <p role="alert" className="text-red-400">
              {T.xbox.achievementsError}
            </p>
            {error === 'private' && <p className="text-xs text-text-secondary">{T.xbox.errors.private}</p>}
            <button onClick={retry} className="text-sm bg-bg-main px-4 py-1.5 rounded-full hover:bg-ink/10 transition-colors">
              {T.xbox.retry}
            </button>
          </section>
        ) : achievements.length === 0 ? (
          <section className="bg-bg-card p-5 rounded-xl w-[95%] mt-5 mb-5 text-center">
            <p className="text-text-secondary">{T.xbox.noAchievements}</p>
          </section>
        ) : (
          <XboxGameInfoTable achievements={achievements} gameId={game.id} gameTitle={game.title} />
        )}
      </motion.div>
    </main>
  )
}
