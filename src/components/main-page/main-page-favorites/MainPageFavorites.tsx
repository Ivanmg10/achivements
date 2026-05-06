'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import AchievementModal from '@/components/achievement-modal/AchievementModal'
import { AnimatePresence } from 'framer-motion'
import { RetroAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { fetchWithRetry } from '@/lib/fetchWithRetry'

interface FavoriteRow {
  achievement_id: number
  game_id: number
  game_title: string
  snapshot: RetroAchievement
  num_distinct_players: number
}

export default function MainPageFavorites() {
  const [favorites, setFavorites] = useState<FavoriteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<FavoriteRow | null>(null)
  const { T } = useLanguage()
  const attemptRef = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doFetch = useCallback(() => {
    setLoading(true)
    fetchWithRetry('/api/favorites')
      .then((data) => {
        if (Array.isArray(data)) setFavorites(data as FavoriteRow[])
        setLoading(false)
        attemptRef.current = 0
      })
      .catch(() => {
        const delay = Math.min(3_000 * 2 ** attemptRef.current, 30_000)
        attemptRef.current++
        retryTimer.current = setTimeout(doFetch, delay)
      })
  }, [])

  useEffect(() => {
    doFetch()
    return () => clearTimeout(retryTimer.current)
  }, [doFetch])

  const handleUnpin = useCallback(async (achievementId: number) => {
    setFavorites((prev) => prev.filter((f) => f.achievement_id !== achievementId))
    await fetch(`/api/favorites?achievementId=${achievementId}`, { method: 'DELETE' })
  }, [])

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary shrink-0">
        {T.favorites.title}
      </p>

      {loading && (
        <div className="flex flex-col gap-2 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-1.5">
              <div className="w-9 h-9 rounded-lg bg-white/10 shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="h-2.5 w-28 rounded bg-white/10" />
                <div className="h-2 w-20 rounded bg-white/10" />
              </div>
              <div className="w-6 h-4 rounded bg-white/10 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {!loading && favorites.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-text-secondary text-sm text-center px-2 py-6">
          {T.favorites.empty}
        </div>
      )}

      {!loading && favorites.length > 0 && (
        <div className="flex flex-col gap-1 overflow-y-auto">
          {favorites.map((fav) => {
            const earned = !!fav.snapshot.DateEarned
            return (
              <div
                key={fav.achievement_id}
                className="group flex items-center gap-2 hover:bg-bg-main/60 rounded-lg px-2 py-1.5 transition-colors"
              >
                <button
                  onClick={() => setSelected(fav)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  {fav.snapshot.BadgeName && (
                    <Image
                      src={`https://media.retroachievements.org/Badge/${fav.snapshot.BadgeName}.png`}
                      alt={fav.snapshot.Title}
                      width={36}
                      height={36}
                      className={`w-9 h-9 rounded-lg object-cover shrink-0 ${earned ? '' : 'grayscale opacity-50'}`}
                    />
                  )}
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{fav.snapshot.Title}</p>
                    <Link
                      href={`/gameInfo/${fav.game_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] text-text-secondary truncate hover:text-text-main transition-colors w-fit max-w-full"
                    >
                      {fav.game_title}
                    </Link>
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-xs font-semibold tabular-nums">{fav.snapshot.Points}</p>
                    <p className="text-[10px] text-text-secondary">pts</p>
                  </div>
                  <button
                    onClick={() => handleUnpin(fav.achievement_id)}
                    aria-label={T.favorites.removeFavorite}
                    className="text-yellow-400 hover:text-yellow-300 transition-colors"
                    title={T.favorites.removeFavorite}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path
                        fillRule="evenodd"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <AchievementModal
            achievement={selected.snapshot}
            numDistinctPlayers={selected.num_distinct_players}
            onClose={() => setSelected(null)}
            gameId={selected.game_id}
            isFavorited={true}
            onToggleFavorite={() => {
              handleUnpin(selected.achievement_id)
              setSelected(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
