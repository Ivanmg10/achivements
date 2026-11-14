'use client'

import { memo, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { IconAlertTriangle } from '@tabler/icons-react'
import dynamic from 'next/dynamic'
import { RetroAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { plural } from '@/utils/utils'
import { useAchievementPins, RA_PINS } from '@/hooks/useAchievementPins'
import { formatDate } from '@/utils/dates'
import { Skeleton } from '@/components/ui/Skeleton'
import { raTypeTag } from '@/components/ui/dataTable'
import { raBadgeUrl } from '@/utils/raAssets'
import BadgeGrid from '@/components/badge-grid/BadgeGrid'
import BadgeEarnedChip from '@/components/badge-grid/badge-tip-parts/BadgeEarnedChip'

// Downloaded the first time it opens, not with the page.
const AchievementModal = dynamic(() => import('@/components/achievement-modal/AchievementModal'), { loading: () => null })

const SKELETON_BADGES = 30

// Missables not earned yet are marked, so they can be seen at a glance before it is too late.
const isMissable = (a: RetroAchievement) => a.Type === 'missable' && !a.DateEarned && !a.DateEarnedHardcore

/** The ring an RA badge wears: hardcore, softcore, or red for a missable one not earned yet. */
function raRing(a: RetroAchievement) {
  if (a.DateEarnedHardcore) return 'ring-hardcore'
  if (a.DateEarned) return 'ring-softcore'
  return isMissable(a) ? 'ring-danger' : undefined
}

/**
 * A retro game's achievements in the shared badge grid: hardcore and softcore tell apart by their ring,
 * and a badge opens the achievement's window instead of a page of its own. The badges are shown once
 * their pictures have loaded (or a moment has passed), so the grid does not fill in piece by piece.
 */
export const AchievementGrid = memo(function AchievementGrid({
  achievements,
  total,
  gameId,
  gameTitle,
  numDistinctPlayers,
  badgeSize = 40,
  limit,
}: {
  achievements: RetroAchievement[]
  total: number
  gameId: number | string
  gameTitle: string
  numDistinctPlayers: number
  badgeSize?: 40 | 48
  /** Show only this many until asked for the rest (a card on a list page). */
  limit?: number
}) {
  const { T, lang } = useLanguage()
  const [selected, setSelected] = useState<RetroAchievement | null>(null)
  // The badge set whose images have loaded. Keyed by the badges, not the array:
  // a parent re-rendering hands over a new array of the same achievements, and
  // treating that as new sent the grid back to its skeleton, over and over.
  const badgeKey = achievements.map((a) => a.BadgeName).join(',')
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const allLoaded = achievements.length === 0 || loadedKey === badgeKey
  const missables = achievements.filter(isMissable).length

  const { pins } = useAchievementPins(RA_PINS, gameId, gameTitle, { numDistinctPlayers })

  useEffect(() => {
    if (!badgeKey) return
    const names = badgeKey.split(',')
    let count = 0
    let cancelled = false
    const finish = () => {
      if (!cancelled) setLoadedKey(badgeKey)
    }
    const done = () => {
      count++
      if (count >= names.length) finish()
    }
    names.forEach((name) => {
      const img = new window.Image()
      img.onload = done
      img.onerror = done
      img.src = raBadgeUrl(name)!
    })
    const timeout = setTimeout(finish, 1500)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [badgeKey])

  if (achievements.length === 0) {
    return (
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: Math.min(total, SKELETON_BADGES) }).map((_, i) => (
          <Skeleton key={i} radius="tile" className={badgeSize === 48 ? 'w-12 h-12' : 'w-10 h-10'} />
        ))}
      </div>
    )
  }

  return (
    <>
      {missables > 0 && (
        <p className="flex items-center gap-1 text-xs font-medium text-danger mb-1.5">
          <IconAlertTriangle size={14} aria-hidden="true" />
          {T.libraryDetail.missable}: {missables}
        </p>
      )}
      <BadgeGrid<RetroAchievement>
        items={achievements}
        keyOf={(a) => a.ID}
        onSelect={setSelected}
        badgeSize={badgeSize}
        limit={limit}
        loading={!allLoaded}
        name={(a) => a.Title}
        label={(a, name) =>
          `${name}, ${isMissable(a) ? `${T.achievement.missable}, ` : ''}${a.DateEarned || a.DateEarnedHardcore ? T.steam.earned : T.steam.locked}`
        }
        earned={(a) => !!(a.DateEarned || a.DateEarnedHardcore)}
        ring={raRing}
        icon={(a) => (a.BadgeName ? (raBadgeUrl(a.BadgeName) ?? null) : null)}
        corner={(a) =>
          isMissable(a) && (
            <span aria-hidden="true" className="absolute bottom-0 right-0 flex items-center justify-center w-4 h-4 rounded-tl-box-md bg-danger text-bg-main">
              <IconAlertTriangle size={11} stroke={2.5} />
            </span>
          )
        }
        tip={(a) => {
          const tag = raTypeTag(a.Type, T.achievement)
          return {
            description: a.Description,
            chips: (
              <>
                <span className="text-xs text-text-secondary">{plural(a.Points, T.plurals.points, lang)}</span>
                {tag && <span className={`text-xs px-1.5 py-0.5 rounded-full ${tag.className}`}>{tag.label}</span>}
                {a.DateEarnedHardcore ? (
                  <BadgeEarnedChip earned label={T.achievement.hardcore} className="bg-warning/20 text-warning" />
                ) : (
                  <BadgeEarnedChip earned={!!a.DateEarned} label={T.achievement.softcore} className="bg-info/20 text-info" />
                )}
              </>
            ),
            date: a.DateEarnedHardcore ?? a.DateEarned ? formatDate(a.DateEarnedHardcore ?? a.DateEarned, lang) : null,
          }
        }}
      />

      <AnimatePresence>
        {selected && (
          <AchievementModal
            achievement={selected}
            numDistinctPlayers={numDistinctPlayers}
            onClose={() => setSelected(null)}
            gameId={typeof gameId === 'string' ? parseInt(gameId) : gameId}
            gameTitle={gameTitle}
            isFavorited={pins.isPinned(selected)}
            onToggleFavorite={() => pins.toggle(selected)}
          />
        )}
      </AnimatePresence>
    </>
  )
})
