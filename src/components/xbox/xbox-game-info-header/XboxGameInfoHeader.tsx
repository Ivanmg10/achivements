'use client'

import type { ReactNode } from 'react'
import XboxLogo from '@/components/xbox-logo/XboxLogo'
import { useLanguage } from '@/context/LanguageContext'
import GameIcon from '@/components/game-icon/GameIcon'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import HideGameButton from '@/components/hide-game-button/HideGameButton'
import { xboxPlatformChip } from '@/utils/xboxTitles'
import { formatPlaytime } from '@/utils/steamFeed'
import { plural } from '@/utils/utils'
import type { XboxGameProgress } from '@/types/xbox'
import type { IgdbDetails } from '@/lib/igdbClient'
import GameHero, { HERO_TOGGLE } from '@/components/game-hero/GameHero'
import GameHeroChip from '@/components/game-hero/game-hero-chip/GameHeroChip'
import GameHeroProgress from '@/components/game-hero/game-hero-progress/GameHeroProgress'
import GameHeroMedia from '@/components/game-hero/game-hero-media/GameHeroMedia'

/**
 * The top of an Xbox game page, on the shared `GameHero` as the others: the
 * gamerscore is a tile beside the achievements. Summary, studios, genres,
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
  /** The AI export, first among the buttons. */
  actions?: ReactNode
}) {
  const { T, lang } = useLanguage()

  const isComplete = game.pctWon >= 100
  const inProgress = game.numAwarded > 0 && !isComplete

  const date = (iso: string | null, utc = false) =>
    iso ? new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric', ...(utc && { timeZone: 'UTC' }) }) : null

  return (
    <GameHero
      cover={<GameIcon source="xbox" id={game.id} imageUrl={game.imageIcon} size={216} className="block w-full aspect-square" />}
      title={game.title}
      chips={
        <>
          <GameHeroChip tone="custom" className={xboxPlatformChip(game.consoleName)}>
            <XboxLogo size={14} aria-hidden="true" />
            {game.consoleName}
          </GameHeroChip>
          {isComplete && <GameHeroChip tone="warning">★ {T.steam.perfect}</GameHeroChip>}
          {inProgress && <GameHeroChip tone="info">{T.gameStatus.inProgress}</GameHeroChip>}
        </>
      }
      description={details?.summary}
      progress={
        <GameHeroProgress
          pct={game.pctWon}
          label={game.title}
          left={<><strong className="text-text-main font-bold">{game.pctWon} %</strong> {T.gameInfoPage.complete}</>}
          right={
            game.totalKnown
              ? T.gameInfoPage.ofAchievements.replace('{n}', String(game.numAwarded)).replace('{total}', String(game.maxPossible))
              : plural(game.numAwarded, T.plurals.achievements, lang)
          }
        />
      }
      facts={[
        // A date-only string: read as UTC, so it is not a day early west of Greenwich.
        { label: T.gameInfoPage.released, value: date(details?.releaseDate ?? null, true) },
        { label: T.gameInfoPage.developer, value: details?.developers.join(', ') },
        { label: T.gameInfoPage.publisher, value: details?.publishers.join(', ') },
        { label: T.gameInfoPage.genre, value: details?.genres.join(', ') },
        { label: T.steam.lastPlayed, value: date(game.lastPlayed) },
      ]}
      actions={actions}
      toggles={
        <>
          <PinToggleButton gameId={game.id} source="xbox" className={HERO_TOGGLE} />
          <HideGameButton source="xbox" gameId={game.id} title={game.title} image={game.imageIcon} className={HERO_TOGGLE} />
        </>
      }
      tiles={[
        { label: T.xbox.achievements, value: game.numAwarded, ...(game.totalKnown ? { of: game.maxPossible } : {}), done: isComplete },
        { label: T.xbox.gamerscore, value: game.earnedGamerscore, of: game.totalGamerscore, done: isComplete },
        ...(game.playtimeMinutes !== null
          ? [{ label: T.steam.playtime, value: formatPlaytime(game.playtimeMinutes, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang) }]
          : []),
      ]}
      media={details && <GameHeroMedia shots={details.screenshots.map((s, i) => ({ src: s.thumb, full: s.full, caption: `${T.steam.screenshot} ${i + 1}` }))} />}
    />
  )
}
