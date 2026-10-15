'use client'

import type { ReactNode } from 'react'
import { IconExternalLink } from '@tabler/icons-react'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { useLanguage } from '@/context/LanguageContext'
import Image from 'next/image'
import GameIcon from '@/components/game-icon/GameIcon'
import GameInfoHeaderStatsBadge from '@/components/game-info-header/game-info-header-stats-badge/GameInfoHeaderStatsBadge'
import PsnTrophyCounts from '@/components/psn/psn-trophy-counts/PsnTrophyCounts'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import HideGameButton from '@/components/hide-game-button/HideGameButton'
import PsnGameInfoHeaderProgression from './psn-game-info-header-progression/PsnGameInfoHeaderProgression'
import GameInfoHeaderScreenshots from '@/components/game-info-header/game-info-header-screenshots/GameInfoHeaderScreenshots'
import { psnPlatformChip } from '@/utils/psnTitles'
import { formatPlaytime } from '@/utils/steamFeed'
import type { PsnGameProgress } from '@/types/psn'
import type { IgdbDetails } from '@/lib/igdbClient'

/**
 * The top of a PSN game page, laid out like SteamGameInfoHeader: cover,
 * title, chips, summary, completion bar and facts on the left; stat badges
 * and two screenshots on the right — play time among them, where Sony
 * reports it. PSN adds the trophies by grade, and "Perfect" becomes the
 * platinum when there is one. Summary, studios, genres and screenshots come
 * from IGDB (`details`, null until loaded or when it has none, and in English).
 */
export default function PsnGameInfoHeader({
  game,
  details = null,
  actions,
}: {
  game: PsnGameProgress
  details?: IgdbDetails | null
  /** Extra buttons beside the store link (the AI export). */
  actions?: ReactNode
}) {
  const { T, lang } = useLanguage()

  const isComplete = game.pctWon >= 100
  const inProgress = game.numAwarded > 0 && !isComplete
  const hasPlatinum = game.defined.platinum > 0

  const date = (iso: string | null, utc = false) =>
    iso ? new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric', ...(utc && { timeZone: 'UTC' }) }) : '—'
  const facts: { label: string; value: string }[] = [
    { label: T.gameInfoPage.id, value: game.titleId },
    { label: T.gameInfoPage.developer, value: details?.developers.join(', ') || '—' },
    { label: T.gameInfoPage.publisher, value: details?.publishers.join(', ') || '—' },
    { label: T.gameInfoPage.genre, value: details?.genres.join(', ') || '—' },
    // A date-only string: read as UTC, so it is not a day early west of Greenwich.
    { label: T.gameInfoPage.released, value: date(details?.releaseDate ?? null, true) },
    { label: T.steam.lastPlayed, value: date(game.lastPlayed) },
    { label: T.psn.lastTrophy, value: date(game.lastTrophyAt) },
  ]

  return (
    <section className="relative bg-transparent p-5 rounded-xl min-w-[95%] grid grid-cols-1 lg:grid-cols-[1fr_minmax(400px,auto)] mt-5 overflow-hidden">
      <div className="relative z-10 flex flex-row items-start gap-5">
        {game.coverUrl ? (
          <Image
            src={game.coverUrl}
            alt={game.title}
            width={200}
            height={300}
            className="w-28 lg:w-50 aspect-2/3 object-cover rounded-xl shrink-0 shadow-xl shadow-black/40"
            unoptimized
          />
        ) : (
          <GameIcon source="psn" id={game.id} imageUrl={game.imageIcon} size={200} className="w-28 h-28 lg:w-50 lg:h-50 rounded-xl shrink-0 shadow-xl shadow-black/40" />
        )}

        <div className="flex flex-col flex-1 min-w-0 gap-3">
          <h1 className="text-2xl lg:text-3xl">{game.title}</h1>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-sm px-2 py-0.5 rounded-md font-medium ${psnPlatformChip(game.consoleName)}`}>
              <PlaystationLogo size={14} aria-hidden="true" />
              {game.consoleName}
            </span>
            {game.earned.platinum > 0 && (
              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md font-medium bg-sky-300/20 text-sky-300">
                ★ {T.psn.platinum}
              </span>
            )}
            {isComplete && game.earned.platinum === 0 && (
              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md font-medium bg-warning/20 text-warning">
                ★ {T.steam.perfect}
              </span>
            )}
            {inProgress && (
              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md font-medium bg-info/20 text-info">
                {T.gameStatus.inProgress}
              </span>
            )}
            <PinToggleButton gameId={game.id} source="psn" />
            <HideGameButton source="psn" gameId={game.id} title={game.title} image={game.imageIcon} />
          </div>

          {details?.summary && <p className="text-sm text-text-secondary max-w-2xl line-clamp-3">{details.summary}</p>}

          <PsnGameInfoHeaderProgression pct={game.pctWon} earned={game.numAwarded} total={game.maxPossible} label={game.title} />

          <PsnTrophyCounts earned={game.earned} of={game.defined} className="text-sm" />

          <ul className="flex flex-col gap-1 text-sm">
            {facts.map((f) => (
              <li key={f.label}>
                <span className="text-text-secondary">{f.label}: </span>
                {f.value}
              </li>
            ))}
          </ul>

          {(game.conceptId !== null || actions) && (
            <div className="flex items-center gap-2 flex-wrap">
              {game.conceptId !== null && (
              <a
                href={`https://store.playstation.com/concept/${game.conceptId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink/8 hover:bg-ink/12 text-text-secondary hover:text-text-main text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                <IconExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                {T.psn.viewOnStore}
              </a>
              )}
              {actions}
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center lg:items-end gap-4 lg:justify-between mt-4 lg:mt-0">
        {/* One row on desktop, platinum last: the column grows to fit it rather than wrap it. */}
        <div className="flex flex-wrap lg:flex-nowrap justify-center lg:justify-end gap-2">
          <GameInfoHeaderStatsBadge label={T.psn.trophies} value={`${game.numAwarded} / ${game.maxPossible}`} done={isComplete} />
          {game.playtimeMinutes !== null && (
            <GameInfoHeaderStatsBadge
              label={T.steam.playtime}
              value={formatPlaytime(game.playtimeMinutes, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang)}
              done={false}
            />
          )}
          {hasPlatinum && (
            <GameInfoHeaderStatsBadge
              label={T.psn.platinum}
              value={game.earned.platinum > 0 ? T.psn.earned : T.psn.locked}
              done={game.earned.platinum > 0}
            />
          )}
        </div>
        {details && (
          // Width 0 with min 100%: the screenshots take the column's width without widening it.
          <div className="w-full flex justify-center lg:w-0 lg:min-w-full">
            <GameInfoHeaderScreenshots screenshots={details.screenshots} title={game.title} />
          </div>
        )}
      </div>
    </section>
  )
}
