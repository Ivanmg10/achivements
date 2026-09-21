'use client'

import { IconExternalLink } from '@tabler/icons-react'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import { useLanguage } from '@/context/LanguageContext'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'
import GameInfoHeaderStatsBadge from '@/components/game-info-header/game-info-header-stats-badge/GameInfoHeaderStatsBadge'
import SteamGameInfoHeaderProgression from './steam-game-info-header-progression/SteamGameInfoHeaderProgression'
import SteamGameInfoHeaderScreenshots from './steam-game-info-header-screenshots/SteamGameInfoHeaderScreenshots'
import { steamStoreUrl } from '@/lib/steamClient'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import { formatPlaytime } from '@/utils/steamFeed'
import type { SteamGameDetails, SteamGameProgress } from '@/types/steam'

/**
 * The top of a Steam game page, laid out like RA's GameInfoHeader: cover,
 * title, chips, completion bar and facts on the left; stat badges and two
 * screenshots on the right.
 *
 * Steam swaps RA's console for a Steam chip, points for playtime, "Mastered"
 * for "Perfect", and adds the store description. Every part tolerates missing
 * data: `game` is null when the game is not in the user's library, `details`
 * when the store has no entry, `counts` until achievements load.
 */
export default function SteamGameInfoHeader({
  appId,
  title,
  game,
  details,
  counts,
}: {
  appId: number
  title: string
  game: SteamGameProgress | null
  details: SteamGameDetails | null
  counts: { earned: number; total: number } | null
}) {
  const { T, lang } = useLanguage()

  const isPerfect = counts !== null && counts.total > 0 && counts.earned >= counts.total
  const inProgress = counts !== null && counts.earned > 0 && !isPerfect

  const facts: { label: string; value: string }[] = [
    { label: T.gameInfoPage.id, value: String(appId) },
    { label: T.gameInfoPage.developer, value: details?.developers.join(', ') || '—' },
    { label: T.gameInfoPage.publisher, value: details?.publishers.join(', ') || '—' },
    { label: T.gameInfoPage.genre, value: details?.genres.join(', ') || '—' },
    { label: T.gameInfoPage.released, value: details?.releaseDate || '—' },
  ]

  return (
    <section className="relative bg-transparent p-5 rounded-xl min-w-[95%] grid grid-cols-1 lg:grid-cols-[1fr_400px] mt-5 overflow-hidden">
      <div className="relative z-10 flex flex-row items-start gap-5">
        <SteamGameImage
          appId={appId}
          asset="cover"
          iconUrl={game?.imageIcon}
          alt={title}
          size={200}
          className="w-28 lg:w-50 aspect-2/3 rounded-xl shrink-0"
        />

        <div className="flex flex-col flex-1 min-w-0 gap-3">
          <h1 className="text-2xl lg:text-3xl">{title}</h1>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-sm px-2 py-0.5 rounded-md font-medium bg-[#1b2838] text-[#66c0f4]">
              <SteamLogo size={14} aria-hidden="true" />
              Steam
            </span>
            {isPerfect && (
              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md font-medium bg-[#a4d007]/20 text-[#a4d007]">
                ★ {T.steam.perfect}
              </span>
            )}
            {inProgress && (
              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md font-medium bg-info/20 text-info">
                {T.gameStatus.inProgress}
              </span>
            )}
            {!game && (
              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-md font-medium bg-bg-card text-text-secondary">
                {T.steam.notOwned}
              </span>
            )}
            <PinToggleButton gameId={appId} source="steam" />
          </div>

          {details?.description && (
            <p className="text-sm text-text-secondary max-w-2xl line-clamp-3">{details.description}</p>
          )}

          {counts && counts.total > 0 && (
            <SteamGameInfoHeaderProgression earned={counts.earned} total={counts.total} label={title} />
          )}

          <ul className="flex flex-col gap-1 text-sm">
            {facts.map((f) => (
              <li key={f.label}>
                <span className="text-text-secondary">{f.label}: </span>
                {f.value}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={steamStoreUrl(appId)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-text-secondary hover:text-text-main text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#66c0f4]"
            >
              <IconExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              {T.steam.viewOnSteam}
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center lg:items-end gap-4 lg:justify-between mt-4 lg:mt-0">
        <div className="flex flex-wrap justify-center lg:justify-end gap-2">
          {counts && counts.total > 0 && (
            <GameInfoHeaderStatsBadge
              label={T.gameInfoPage.achievements}
              value={`${counts.earned} / ${counts.total}`}
              done={isPerfect}
            />
          )}
          {game && (
            <GameInfoHeaderStatsBadge
              label={T.steam.playtime}
              value={formatPlaytime(game.playtimeForever, { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }, lang)}
              done={false}
            />
          )}
        </div>
        {details && <SteamGameInfoHeaderScreenshots screenshots={details.screenshots} title={title} />}
      </div>
    </section>
  )
}
