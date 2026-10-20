'use client'

import { useMemo } from 'react'
import type { RetroAchievementsGameCompleted } from '@/types/types'
import type { SteamGameProgress } from '@/types/steam'
import type { PsnGameProgress } from '@/types/psn'
import type { XboxGameProgress } from '@/types/xbox'
import { useSubject } from '@/context/SubjectContext'
import { classifySteamGame } from '@/utils/steamFeed'
import { classifyPsnGame } from '@/utils/psnTitles'
import { classifyXboxGame, xboxHasAchievements } from '@/utils/xboxTitles'
import { gameHref } from '@/utils/gameRef'
import { ChartCard } from '@/components/ui/ChartCard'
import ClosestToComplete, { CLOSEST_SHOWN, type ClosestGame } from '@/components/main-page/main-page-charts/closest-to-complete/ClosestToComplete'

/** The started games nearest 100%, whichever platform they are on: beside the collection, what could join it next. */
export default function CollectionClosest({
  inProgress = [],
  steamGames = [],
  psnGames = [],
  xboxGames = [],
}: {
  inProgress?: RetroAchievementsGameCompleted[]
  steamGames?: SteamGameProgress[]
  psnGames?: PsnGameProgress[]
  xboxGames?: XboxGameProgress[]
}) {
  const subject = useSubject()
  const closest = useMemo<ClosestGame[]>(() => {
    const ra = inProgress.map((g) => ({
      key: `ra:${g.GameID}`,
      href: gameHref('ra', g.GameID, subject),
      title: g.Title,
      imageUrl: g.ImageIcon ? `https://retroachievements.org${g.ImageIcon}` : undefined,
      done: g.NumAwarded,
      total: g.MaxPossible,
      percent: parseFloat(g.PctWon) * 100,
    }))
    const st = steamGames
      .filter((g) => classifySteamGame(g) === 'playing')
      .map((g) => ({
        key: `steam:${g.id}`,
        href: gameHref('steam', g.id, subject),
        title: g.title,
        imageUrl: g.imageIcon || undefined,
        done: g.numAwarded,
        total: g.maxPossible,
        percent: g.pctWon,
      }))
    const ps = psnGames
      .filter((g) => classifyPsnGame(g) === 'playing')
      .map((g) => ({
        key: `psn:${g.id}`,
        href: gameHref('psn', g.id, subject),
        title: g.title,
        imageUrl: g.imageIcon || undefined,
        done: g.numAwarded,
        total: g.maxPossible,
        percent: g.pctWon,
      }))
    // A game with no achievements is just owned: it has no place in a completion count.
    const xb = xboxGames
      .filter(xboxHasAchievements)
      .filter((g) => classifyXboxGame(g) === 'playing')
      .map((g) => ({
        key: `xbox:${g.id}`,
        href: gameHref('xbox', g.id, subject),
        title: g.title,
        imageUrl: g.imageIcon || undefined,
        done: g.numAwarded,
        // Newer games do not say how many achievements they have: the count shows by what is earned.
        total: g.maxPossible,
        percent: g.pctWon,
      }))
    return [...ra, ...st, ...ps, ...xb].sort((a, b) => b.percent - a.percent).slice(0, CLOSEST_SHOWN)
  }, [inProgress, steamGames, psnGames, xboxGames, subject])

  // Nothing at all, not an empty card: the collection beside it then takes the row.
  if (closest.length === 0) return null
  return (
    <ChartCard>
      <ClosestToComplete games={closest} statClassName="text-accent" />
    </ChartCard>
  )
}
