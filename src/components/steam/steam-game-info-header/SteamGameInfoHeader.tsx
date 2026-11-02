'use client'

import type { ReactNode } from 'react'
import { IconExternalLink } from '@tabler/icons-react'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import { useLanguage } from '@/context/LanguageContext'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'
import { steamAssetUrl, steamStoreUrl } from '@/lib/steamAssets'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import HideGameButton from '@/components/hide-game-button/HideGameButton'
import { formatPlaytime } from '@/utils/steamFeed'
import type { SteamGameDetails, SteamGameProgress } from '@/types/steam'
import { buttonClass } from '@/components/ui/Button'
import GameHero, { HERO_TOGGLE } from '@/components/game-hero/GameHero'
import GameHeroChip from '@/components/game-hero/game-hero-chip/GameHeroChip'
import GameHeroProgress from '@/components/game-hero/game-hero-progress/GameHeroProgress'
import GameHeroMedia from '@/components/game-hero/game-hero-media/GameHeroMedia'

/**
 * The top of a Steam game page, on the shared `GameHero` as RA's: Steam swaps
 * the console for a Steam chip, points for play time and "Mastered" for
 * "Perfect", and adds the store description. Every part tolerates missing
 * data: `game` is null when the game is not in the user's library, `details`
 * when the store has no entry, `counts` until achievements load.
 */
export default function SteamGameInfoHeader({
  appId,
  title,
  game,
  details,
  counts,
  actions,
}: {
  appId: number
  title: string
  game: SteamGameProgress | null
  details: SteamGameDetails | null
  counts: { earned: number; total: number } | null
  /** The AI export, first among the buttons. */
  actions?: ReactNode
}) {
  const { T, lang } = useLanguage()

  const isPerfect = counts !== null && counts.total > 0 && counts.earned >= counts.total
  const inProgress = counts !== null && counts.earned > 0 && !isPerfect
  const pct = counts && counts.total > 0 ? (counts.earned / counts.total) * 100 : 0

  return (
    <GameHero
      cover={<SteamGameImage appId={appId} asset="cover" iconUrl={game?.imageIcon} alt={title} size={216} className="block w-full aspect-2/3" />}
      title={title}
      chips={
        <>
          <GameHeroChip tone="custom" className="bg-[#1b2838] text-[#66c0f4]">
            <SteamLogo size={14} aria-hidden="true" />
            Steam
          </GameHeroChip>
          {isPerfect && <GameHeroChip tone="warning">★ {T.steam.perfect}</GameHeroChip>}
          {inProgress && <GameHeroChip tone="info">{T.gameStatus.inProgress}</GameHeroChip>}
          {!game && <GameHeroChip>{T.steam.notOwned}</GameHeroChip>}
        </>
      }
      description={details?.description}
      progress={
        counts && counts.total > 0 && (
          <GameHeroProgress
            pct={pct}
            label={title}
            left={<><strong className="text-text-main font-bold">{pct.toLocaleString(lang, { maximumFractionDigits: 1 })} %</strong> {T.gameInfoPage.complete}</>}
            right={T.gameInfoPage.ofAchievements.replace('{n}', String(counts.earned)).replace('{total}', String(counts.total))}
          />
        )
      }
      facts={[
        { label: T.gameInfoPage.released, value: details?.releaseDate },
        { label: T.gameInfoPage.developer, value: details?.developers.join(', ') },
        { label: T.gameInfoPage.publisher, value: details?.publishers.join(', ') },
        { label: T.gameInfoPage.genre, value: details?.genres.join(', ') },
      ]}
      actions={
        <>
          {actions}
          <a href={steamStoreUrl(appId)} target="_blank" rel="noopener noreferrer" className={buttonClass('secondary')}>
            <IconExternalLink className="w-4 h-4" aria-hidden="true" />
            {T.steam.viewOnSteam}
          </a>
        </>
      }
      toggles={
        <>
          <PinToggleButton gameId={appId} source="steam" className={HERO_TOGGLE} />
          {game && <HideGameButton source="steam" gameId={appId} title={title} image={steamAssetUrl(appId, 'header')} className={HERO_TOGGLE} />}
        </>
      }
      tiles={[
        ...(counts && counts.total > 0 ? [{ label: T.gameInfoPage.achievements, value: counts.earned, of: counts.total, done: isPerfect }] : []),
        ...(game ? [{ label: T.steam.playtime, value: formatPlaytime(game.playtimeForever, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang) }] : []),
      ]}
      media={details && <GameHeroMedia shots={details.screenshots.map((s, i) => ({ src: s.thumb, full: s.full, caption: `${T.steam.screenshot} ${i + 1}` }))} />}
    />
  )
}
