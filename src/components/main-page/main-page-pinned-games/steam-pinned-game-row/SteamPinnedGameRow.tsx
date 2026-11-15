'use client'

import SteamLogo from '@/components/steam-logo/SteamLogo'
import { useLanguage } from '@/context/LanguageContext'
import { steamAssetUrl } from '@/lib/steamAssets'
import { useSteamGamesData } from '@/context/SteamGamesDataContext'
import { COVER_ROW_IMAGE } from '@/components/game-card-cover/GameCardCover'
import SteamGameImage from '@/components/steam/steam-game-image/SteamGameImage'
import SteamRecentlyPlayedExpanded from '@/components/steam/steam-recently-played-expanded/SteamRecentlyPlayedExpanded'
import { gameHref } from '@/utils/gameRef'
import { toSteamGameProgress } from '@/utils/steamMappers'
import { GameRowSkeleton } from '@/components/ui/GameRowSkeleton'
import PinnedGameCard from '../pinned-game-card/PinnedGameCard'

/**
 * A pinned Steam game on the home. Game data comes from the shared library, so a pin costs no request
 * of its own; one for a game no longer in it (refunded, family share ended) still renders, with what
 * can be known without it.
 */
export default function SteamPinnedGameRow({
  appId,
  isOpen,
  onToggle,
}: {
  appId: number
  isOpen: boolean
  onToggle: () => void
}) {
  const { T } = useLanguage()
  const { library, recent, libraryLoading } = useSteamGamesData()
  const card = { source: 'steam', gameId: appId, isOpen, onToggle } as const

  const found = library.find((g) => g.id === appId) ?? recent.find((g) => g.id === appId)
  if (!found && libraryLoading) return <PinnedGameCard {...card} placeholder={<GameRowSkeleton />} />

  const game = found ?? toSteamGameProgress({ appid: appId, name: `App ${appId}`, playtime_forever: 0, has_community_visible_stats: true })
  const hasCounts = game.achievementsLoaded && game.maxPossible > 0

  return (
    <PinnedGameCard
      {...card}
      view={{
        href: gameHref('steam', appId),
        title: game.title,
        backdrop: steamAssetUrl(appId, 'header'),
        cover: <SteamGameImage appId={appId} asset="icon" iconUrl={game.imageIcon} size={56} className={COVER_ROW_IMAGE} />,
        platform: (
          <>
            <SteamLogo size={12} className="opacity-60" aria-hidden="true" />
            Steam
          </>
        ),
        progress: hasCounts ? { pct: game.pctWon } : null,
        counts: hasCounts && <span>{game.numAwarded}/{game.maxPossible} {T.statusGameItem.achievements}</span>,
        expand: { show: T.cards.showAchievements, hide: T.cards.hideAchievements },
        panel: game.hasStats ? <SteamRecentlyPlayedExpanded game={game} /> : <p className="text-sm text-text-secondary">{T.steam.noAchievements}</p>,
      }}
    />
  )
}
