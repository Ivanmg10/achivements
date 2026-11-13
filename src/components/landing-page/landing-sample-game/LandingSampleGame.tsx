'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { SampleGame } from '@/components/landing-page/landingSamples'
import type { FeedRing } from '@/types/gameCard'
import type { GameSource } from '@/types/game'
import FeedGameCard from '@/components/feed-game-card/FeedGameCard'
import FeedGameCardPlaytime from '@/components/feed-game-card/feed-game-card-playtime/FeedGameCardPlaytime'
import LandingSampleExpanded from '@/components/landing-page/landing-sample-expanded/LandingSampleExpanded'
import { PLATFORM_NAME } from '@/utils/gameRef'

// The ring a finished game gets, as each platform's feed row gives it (RaGameItem, SteamGameItem, PsnGameItem).
const DONE_RING: Partial<Record<GameSource, FeedRing>> = { ra: 'warning', steam: 'warning', psn: 'platinum' }

/**
 * One example game, drawn as the home's feed draws a game (`FeedGameCard`): its art behind it, its cover, name and
 * platform, its bar and what it counts. A Steam example opens like the home's (`LandingSampleExpanded`, one at a time,
 * the library says which); the others stay closed, as their achievements are not in the sample. Not a link: an example.
 */
export default function LandingSampleGame({ game, open, onToggle }: { game: SampleGame; open: boolean; onToggle: () => void }) {
  const { T, lang } = useLanguage()
  const pct = Math.round((game.earned / game.total) * 100)
  const done = game.earned >= game.total
  const counted = (game.source === 'psn' ? T.gameInfoPage.ofTrophies : T.gameInfoPage.ofAchievements)
    .replace('{n}', game.earned.toLocaleString(lang))
    .replace('{total}', game.total.toLocaleString(lang))

  return (
    <li>
      <FeedGameCard
        title={game.title}
        backdrop={game.art ?? game.cover}
        icon={(cls) => <img src={game.cover} alt="" loading="lazy" decoding="async" className={`${cls} object-cover`} />}
        ring={done ? DONE_RING[game.source] : undefined}
        platform={{ source: game.source === 'ra' ? undefined : game.source, label: game.console ?? PLATFORM_NAME[game.source] }}
        progress={{ pct, percent: pct, done }}
        facts={[<span key="n" className="whitespace-nowrap">{counted}</span>, game.hours ? <FeedGameCardPlaytime key="h" minutes={game.hours * 60} /> : null]}
        expand={game.appId ? { show: T.cards.showAchievements, hide: T.cards.hideAchievements } : undefined}
        expanded={open}
        onToggle={onToggle}
      >
        {game.appId && <LandingSampleExpanded appId={game.appId} total={game.total} minutes={(game.hours ?? 0) * 60} />}
      </FeedGameCard>
    </li>
  )
}
