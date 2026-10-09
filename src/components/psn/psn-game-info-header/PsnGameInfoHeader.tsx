'use client'

import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { useLanguage } from '@/context/LanguageContext'
import Image from 'next/image'
import GameIcon from '@/components/game-icon/GameIcon'
import GameInfoHeaderStatsBadge from '@/components/game-info-header/game-info-header-stats-badge/GameInfoHeaderStatsBadge'
import PsnTrophyCounts from '@/components/psn/psn-trophy-counts/PsnTrophyCounts'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import HideGameButton from '@/components/hide-game-button/HideGameButton'
import PsnGameInfoHeaderProgression from './psn-game-info-header-progression/PsnGameInfoHeaderProgression'
import { formatPlaytime } from '@/utils/steamFeed'
import { countTrophies, psnPlatformChip } from '@/utils/psnTitles'
import type { PsnGameProgress } from '@/types/psn'

/**
 * The top of a PSN game page, laid out like SteamGameInfoHeader: cover,
 * title, chips, completion bar and facts on the left; stat badges on the
 * right — play time among them, where Sony reports it. PSN adds the trophies
 * by grade, and "Perfect" becomes the platinum when there is one.
 */
export default function PsnGameInfoHeader({ game }: { game: PsnGameProgress }) {
  const { T, lang } = useLanguage()

  const isComplete = game.pctWon >= 100
  const inProgress = game.numAwarded > 0 && !isComplete
  const hasPlatinum = game.defined.platinum > 0

  const date = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
  const facts: { label: string; value: string }[] = [
    { label: T.gameInfoPage.id, value: game.titleId },
    { label: T.psn.platform, value: game.consoleName },
    { label: T.steam.lastPlayed, value: date(game.lastPlayed) },
    { label: T.psn.lastTrophy, value: date(game.lastTrophyAt) },
  ]

  return (
    <section className="relative bg-transparent p-5 rounded-xl min-w-[95%] grid grid-cols-1 lg:grid-cols-[1fr_400px] mt-5 overflow-hidden">
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
              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md font-medium bg-[#a4d007]/20 text-[#a4d007]">
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

          <PsnGameInfoHeaderProgression pct={game.pctWon} earned={game.numAwarded} total={game.maxPossible} label={game.title} />

          <PsnTrophyCounts earned={game.earned} of={game.defined} className="text-sm" />

          {game.hasDlc && (
            <p className="text-xs text-text-secondary">
              {T.psn.withDlc}: {countTrophies(game.full.earned)} / {countTrophies(game.full.defined)} · {game.full.pctWon}%
            </p>
          )}

          <ul className="flex flex-col gap-1 text-sm">
            {facts.map((f) => (
              <li key={f.label}>
                <span className="text-text-secondary">{f.label}: </span>
                {f.value}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center lg:items-end gap-4 mt-4 lg:mt-0">
        <div className="flex flex-wrap justify-center lg:justify-end gap-2">
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
      </div>
    </section>
  )
}
