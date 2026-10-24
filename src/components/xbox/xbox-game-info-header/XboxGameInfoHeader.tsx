'use client'

import type { ReactNode } from 'react'
import XboxLogo from '@/components/xbox-logo/XboxLogo'
import { useLanguage } from '@/context/LanguageContext'
import GameIcon from '@/components/game-icon/GameIcon'
import GameInfoHeaderStatsBadge from '@/components/game-info-header/game-info-header-stats-badge/GameInfoHeaderStatsBadge'
import XboxGamerscore from '@/components/xbox/xbox-gamerscore/XboxGamerscore'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import HideGameButton from '@/components/hide-game-button/HideGameButton'
import XboxGameInfoHeaderProgression from './xbox-game-info-header-progression/XboxGameInfoHeaderProgression'
import GameInfoHeaderScreenshots from '@/components/game-info-header/game-info-header-screenshots/GameInfoHeaderScreenshots'
import { xboxPlatformChip } from '@/utils/xboxTitles'
import { formatPlaytime } from '@/utils/steamFeed'
import type { XboxGameProgress } from '@/types/xbox'
import type { IgdbDetails } from '@/lib/igdbClient'

/**
 * The top of an Xbox game page, laid out like PsnGameInfoHeader: cover, title,
 * chips, summary, completion bar and facts on the left; stat badges and two
 * screenshots on the right. Xbox adds the gamerscore. Summary, studios, genres,
 * release date and screenshots come from IGDB (`details`, null until loaded or
 * when it has none, and in English), since Xbox's library has none of them.
 */
export default function XboxGameInfoHeader({
  game,
  details = null,
  actions,
}: {
  game: XboxGameProgress
  details?: IgdbDetails | null
  /** Extra buttons (the AI export). */
  actions?: ReactNode
}) {
  const { T, lang } = useLanguage()

  const isComplete = game.pctWon >= 100
  const inProgress = game.numAwarded > 0 && !isComplete

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
  ]

  return (
    <section className="relative p-5 lg:px-8 min-w-[95%] grid grid-cols-1 gap-8 lg:grid-cols-[1fr_minmax(400px,auto)] mt-5 overflow-hidden">
      <div className="relative z-10 flex flex-row items-start gap-5">
        <GameIcon source="xbox" id={game.id} imageUrl={game.imageIcon} size={200} className="w-28 h-28 lg:w-50 lg:h-50 rounded-xl shrink-0 shadow-xl shadow-black/40" />

        <div className="flex flex-col flex-1 min-w-0 gap-3">
          <h1 className="font-display italic font-extrabold text-4xl lg:text-6xl leading-[0.9] pr-2 text-text-main">{game.title}</h1>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-chip text-xs font-bold ${xboxPlatformChip(game.consoleName)}`}>
              <XboxLogo size={14} aria-hidden="true" />
              {game.consoleName}
            </span>
            {isComplete && (
              <span className="inline-flex items-center h-7 px-2.5 rounded-chip text-xs font-bold bg-warning/20 text-warning">
                ★ {T.steam.perfect}
              </span>
            )}
            {inProgress && (
              <span className="inline-flex items-center h-7 px-2.5 rounded-chip text-xs font-bold bg-info/20 text-info">
                {T.gameStatus.inProgress}
              </span>
            )}
            <PinToggleButton gameId={game.id} source="xbox" />
            <HideGameButton source="xbox" gameId={game.id} title={game.title} image={game.imageIcon} />
          </div>

          {details?.summary && <p className="text-sm text-text-secondary max-w-2xl line-clamp-3">{details.summary}</p>}

          <XboxGameInfoHeaderProgression
            pct={game.pctWon}
            earned={game.numAwarded}
            total={game.totalKnown ? game.maxPossible : null}
            label={game.title}
          />

          <XboxGamerscore earned={game.earnedGamerscore} total={game.totalGamerscore} className="text-sm" />

          <ul className="flex flex-col gap-1 text-sm">
            {facts.map((f) => (
              <li key={f.label}>
                <span className="text-text-secondary">{f.label}: </span>
                {f.value}
              </li>
            ))}
          </ul>

          {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center lg:items-end gap-4 lg:justify-between mt-4 lg:mt-0">
        <div className="flex flex-wrap lg:flex-nowrap justify-center lg:justify-end gap-2">
          <GameInfoHeaderStatsBadge
            label={T.xbox.achievements}
            value={game.totalKnown ? `${game.numAwarded} / ${game.maxPossible}` : String(game.numAwarded)}
            done={isComplete}
          />
          <GameInfoHeaderStatsBadge label={T.xbox.gamerscore} value={`${game.earnedGamerscore} / ${game.totalGamerscore}`} done={isComplete} />
          {game.playtimeMinutes !== null && (
            <GameInfoHeaderStatsBadge
              label={T.steam.playtime}
              value={formatPlaytime(game.playtimeMinutes, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang)}
              done={false}
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
