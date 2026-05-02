'use client'

import Image from 'next/image'
import { CONSOLES } from '@/constants'
import { useGamesInProgressPreview } from '@/hooks/useGamesInProgressPreview'
import { useWantGamesPreview } from '@/hooks/useWantGamesPreview'
import { useGamesCompletedPreview } from '@/hooks/useGamesCompletedPreview'

const TOP_N = 5

export default function MainPageProfileConsoles() {
  const { listGames: playing } = useGamesInProgressPreview()
  const { wantGames } = useWantGamesPreview()
  const { listGames, listGamesHardcore } = useGamesCompletedPreview()

  const allGames = [...playing, ...wantGames, ...listGames, ...listGamesHardcore]

  const counts: Record<number, { name: string; count: number }> = {}
  for (const game of allGames) {
    if (!counts[game.ConsoleID]) {
      counts[game.ConsoleID] = { name: game.ConsoleName, count: 0 }
    }
    counts[game.ConsoleID].count++
  }

  const sorted = Object.entries(counts)
    .map(([id, data]) => ({ id: Number(id), ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N)

  const max = sorted[0]?.count ?? 1

  if (sorted.length === 0) return null

  return (
    <div className="bg-bg-card rounded-lg p-3 flex flex-col gap-2">
      <p className="text-xs text-gray-400 uppercase tracking-wider">Most played consoles</p>
      <div className="flex flex-col gap-2">
        {sorted.map(({ id, name, count }) => {
          const icon = CONSOLES.find((c) => c.id === id)?.icon
          const pct = Math.round((count / max) * 100)
          return (
            <div key={id} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 justify-between">
                <div className="flex items-center gap-1.5">
                  {icon && (
                    <Image src={icon} alt={name} width={12} height={12} className="object-contain" />
                  )}
                  <span className="text-xs text-text-main">{name}</span>
                </div>
                <span className="text-xs text-text-secondary">{count}</span>
              </div>
              <div className="h-1 bg-bg-main rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
