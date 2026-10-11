'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useSteamAchievements } from '@/hooks/useSteamAchievements'
import { SteamAchievementGrid } from '@/components/steam/steam-achievement-grid/SteamAchievementGrid'
import LibraryGameDetail, { type LibraryCategory } from '@/components/library-game-detail/LibraryGameDetail'
import { fromSteam } from '@/utils/gameInsights'
import { formatPlaytime } from '@/utils/steamFeed'
import type { SteamGameProgress } from '@/types/steam'

const asCategory = (c?: string): LibraryCategory => (c === 'wantToPlay' || c === 'completed' ? c : 'playing')

/**
 * An opened Steam card in a status list. The achievements load when this
 * mounts, i.e. when the card is opened; until then the ring uses the counts
 * the list already has.
 */
export default function SteamLibraryDetail({ game, category }: { game: SteamGameProgress; category?: string }) {
  const { T, lang } = useLanguage()
  const { achievements, isLoading, error, retry } = useSteamAchievements(game.id)
  const items = useMemo(() => fromSteam(achievements, game.id), [achievements, game.id])

  const loaded = achievements.length > 0
  const total = loaded ? achievements.length : game.maxPossible
  const earned = loaded ? achievements.filter((a) => a.earned).length : game.numAwarded
  const units = { minutes: T.steam.minutesShort, hours: T.steam.hoursShort }

  return (
    <LibraryGameDetail
      category={asCategory(category)}
      game={{ source: 'steam', id: game.id, title: game.title, iconUrl: game.imageIcon || undefined }}
      items={items}
      state={isLoading ? 'loading' : error ? 'error' : 'ready'}
      errorNode={
        <div className="flex flex-col items-start gap-2">
          <p role="alert" className="text-sm text-red-400">{T.steam.achievementsError}</p>
          <p className="text-xs text-text-secondary">{T.steam.privateProfileHint}</p>
          <button onClick={retry} className="text-xs bg-bg-main px-3 py-1 rounded-full hover:bg-ink/10 transition-colors">
            {T.steam.retry}
          </button>
        </div>
      }
      ring={{ earned, total, label: T.gameExpanded.allAchievements }}
      facts={[
        { label: T.steam.playtime, value: formatPlaytime(game.playtimeForever, units, lang), className: 'text-[#66c0f4]' },
        ...(game.playtime2Weeks > 0 ? [{ label: T.steam.last2Weeks, value: formatPlaytime(game.playtime2Weeks, units, lang) }] : []),
      ]}
      empty={T.steam.noAchievements}
      grid={<SteamAchievementGrid appId={game.id} gameTitle={game.title} achievements={achievements} badgeSize={48} limit={60} />}
    />
  )
}
