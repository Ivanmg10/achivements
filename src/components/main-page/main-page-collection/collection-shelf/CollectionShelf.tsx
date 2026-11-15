'use client'

import Link from 'next/link'
import { IconTrophy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { gameHref } from '@/utils/gameRef'
import type { LatestPerfect, PerfectCounts } from '@/utils/perfectGames'
import GameCover from '@/components/game-cover/GameCover'
import EmptyState from '@/components/empty-state/EmptyState'
import { useSubject } from '@/context/SubjectContext'
import Facts from '@/components/ui/Facts'
import SectionHead from '@/components/ui/SectionHead'
import DateText from '@/components/ui/DateText'

/**
 * The trophy cabinet: the latest games taken to 100%, newest first, as a row
 * of tiles from the left (a date order, not a ranking: no place on them,
 * #130). Every box has the same height and its own proportions (as on the
 * game page), with name, console and date under it and how it was finished in
 * a word: hardcore, platinum or 100%. On a phone the row scrolls sideways.
 */
export default function CollectionShelf({ games, counts }: { games: LatestPerfect[]; counts: PerfectCounts }) {
  const { T } = useLanguage()
  const subject = useSubject()
  const how = (game: LatestPerfect) =>
    game.hardcore
      ? { text: T.achievement.hardcore, className: 'text-hardcore' }
      : game.platinum
        ? { text: T.psn.platinum, className: 'text-platinum' }
        : { text: T.cards.perfectWord, className: 'text-text-secondary' }

  return (
    <div className="flex flex-col gap-4">
      <SectionHead
        as="h3"
        size="lg"
        title={T.cards.trophyCabinet}
        aside={
          <Facts
            items={[
              <span key="hc" className="text-hardcore font-semibold">{counts.hc} {T.achievement.hardcore}</span>,
              <span key="sc">{counts.sc} {T.achievement.softcore}</span>,
              counts.steam > 0 && <span key="st" className="text-steam font-semibold">{counts.steam} Steam</span>,
              counts.psn > 0 && <span key="psn" className="text-psn font-semibold">{counts.psn} PlayStation</span>,
              counts.xbox > 0 && <span key="xb" className="text-success font-semibold">{counts.xbox} Xbox</span>,
            ]}
          />
        }
      />

      {games.length === 0 ? (
        <EmptyState icon={<IconTrophy className="w-6 h-6" />} title={T.cards.noCompletedGames} subtitle={T.cards.noCompletedGamesSub} size="compact" />
      ) : (
        <ol className="flex gap-3 overflow-x-auto snap-x [scrollbar-width:none] enter-cards">
          {games.map((game) => {
            const finished = how(game)
            return (
              <li key={game.key} className="snap-start w-36 shrink-0">
                <Link
                  href={gameHref(game.source, game.id, subject)}
                  className="group flex flex-col items-center gap-3 h-full rounded-tile bg-bg-main ring-1 ring-ink/[0.04] p-3 hover:ring-ink/15 transition focus-ring"
                >
                  {/* Same height for every box, standing on its bottom edge, own proportions. */}
                  <span className="h-28 sm:h-32 w-full flex items-end justify-center transition-transform duration-300 group-hover:-translate-y-1">
                    <GameCover source={game.source} id={game.id} iconUrl={game.iconUrl} className="h-full" />
                  </span>
                  <span className="flex flex-col items-center w-full min-w-0">
                    <span className="text-xs font-semibold truncate max-w-full">{game.title}</span>
                    <span className="text-[11px] text-text-secondary truncate max-w-full">
                      <Facts items={[game.subtitle, <DateText key="d" value={game.date} />]} />
                    </span>
                    <span className={`text-[11px] font-semibold ${finished.className}`}>{finished.text}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
