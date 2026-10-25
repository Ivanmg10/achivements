'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import { IconExternalLink } from '@tabler/icons-react'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { useLanguage } from '@/context/LanguageContext'
import GameIcon from '@/components/game-icon/GameIcon'
import PsnTrophyCounts from '@/components/psn/psn-trophy-counts/PsnTrophyCounts'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import HideGameButton from '@/components/hide-game-button/HideGameButton'
import { psnPlatformChip } from '@/utils/psnTitles'
import { formatPlaytime } from '@/utils/steamFeed'
import type { PsnGameProgress } from '@/types/psn'
import type { IgdbDetails } from '@/lib/igdbClient'
import { buttonClass } from '@/components/ui/Button'
import GameHero, { HERO_TOGGLE } from '@/components/game-hero/GameHero'
import GameHeroChip from '@/components/game-hero/game-hero-chip/GameHeroChip'
import GameHeroProgress from '@/components/game-hero/game-hero-progress/GameHeroProgress'
import GameHeroMedia from '@/components/game-hero/game-hero-media/GameHeroMedia'

/**
 * The top of a PSN game page, on the shared `GameHero` as RA's and Steam's.
 * PSN adds the trophies by grade under the progress, and "Perfect" becomes the
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
  /** The AI export, first among the buttons. */
  actions?: ReactNode
}) {
  const { T, lang } = useLanguage()

  const isComplete = game.pctWon >= 100
  const inProgress = game.numAwarded > 0 && !isComplete
  const hasPlatinum = game.defined.platinum > 0

  const date = (iso: string | null, utc = false) =>
    iso ? new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric', ...(utc && { timeZone: 'UTC' }) }) : null

  return (
    <GameHero
      cover={
        game.coverUrl ? (
          <Image src={game.coverUrl} alt={game.title} width={216} height={324} className="block w-full aspect-2/3 object-cover" unoptimized />
        ) : (
          <GameIcon source="psn" id={game.id} imageUrl={game.imageIcon} size={216} className="block w-full aspect-square" />
        )
      }
      title={game.title}
      chips={
        <>
          <GameHeroChip tone="custom" className={psnPlatformChip(game.consoleName)}>
            <PlaystationLogo size={14} aria-hidden="true" />
            {game.consoleName}
          </GameHeroChip>
          {game.earned.platinum > 0 && <GameHeroChip tone="info">★ {T.psn.platinum}</GameHeroChip>}
          {isComplete && game.earned.platinum === 0 && <GameHeroChip tone="warning">★ {T.steam.perfect}</GameHeroChip>}
          {inProgress && <GameHeroChip tone="info">{T.gameStatus.inProgress}</GameHeroChip>}
        </>
      }
      description={details?.summary}
      progress={
        <GameHeroProgress
          pct={game.pctWon}
          label={game.title}
          left={<><strong className="text-text-main font-bold">{game.pctWon} %</strong> {T.gameInfoPage.complete}</>}
          right={T.gameInfoPage.ofTrophies.replace('{n}', String(game.numAwarded)).replace('{total}', String(game.maxPossible))}
        />
      }
      facts={[
        // A date-only string: read as UTC, so it is not a day early west of Greenwich.
        { label: T.gameInfoPage.released, value: date(details?.releaseDate ?? null, true) },
        { label: T.gameInfoPage.developer, value: details?.developers.join(', ') },
        { label: T.gameInfoPage.publisher, value: details?.publishers.join(', ') },
        { label: T.gameInfoPage.genre, value: details?.genres.join(', ') },
        { label: T.steam.lastPlayed, value: date(game.lastPlayed) },
        { label: T.psn.lastTrophy, value: date(game.lastTrophyAt) },
      ]}
      actions={
        <>
          {actions}
          {game.conceptId !== null && (
            <a href={`https://store.playstation.com/concept/${game.conceptId}`} target="_blank" rel="noopener noreferrer" className={buttonClass('secondary')}>
              <IconExternalLink className="w-4 h-4" aria-hidden="true" />
              {T.psn.viewOnStore}
            </a>
          )}
        </>
      }
      toggles={
        <>
          <PinToggleButton gameId={game.id} source="psn" className={HERO_TOGGLE} />
          <HideGameButton source="psn" gameId={game.id} title={game.title} image={game.imageIcon} className={HERO_TOGGLE} />
        </>
      }
      tiles={[
        { label: T.psn.trophies, value: game.numAwarded, of: game.maxPossible, done: isComplete },
        ...(game.playtimeMinutes !== null
          ? [{ label: T.steam.playtime, value: formatPlaytime(game.playtimeMinutes, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang) }]
          : hasPlatinum
            ? [{ label: T.psn.platinum, value: game.earned.platinum > 0 ? T.psn.earned : T.psn.locked, done: game.earned.platinum > 0 }]
            : []),
      ]}
      media={details && <GameHeroMedia shots={details.screenshots.map((s, i) => ({ src: s.thumb, full: s.full, caption: `${T.steam.screenshot} ${i + 1}` }))} />}
    >
      <PsnTrophyCounts earned={game.earned} of={game.defined} className="text-sm" />
    </GameHero>
  )
}
