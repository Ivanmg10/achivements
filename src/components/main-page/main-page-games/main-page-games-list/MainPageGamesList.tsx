'use client'

import { CONSOLES } from '@/constants'
import {
  RetroAchievementsGame,
  RetroAchievementsGameCompleted,
  WantToPlayGame,
} from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import Image from 'next/image'
import Link from 'next/link'

type AnyGame = RetroAchievementsGame | WantToPlayGame | RetroAchievementsGameCompleted

function isCompleted(game: AnyGame): game is RetroAchievementsGameCompleted {
  return 'PctWon' in game && game.PctWon !== undefined
}

function ringColor(game: AnyGame): string {
  if (!isCompleted(game)) return ''
  const pct = (parseFloat(game.PctWon) || 0) * 100
  if (pct < 100) return ''
  return game.HardcoreMode === '1' ? 'ring-2 ring-yellow-400' : 'ring-2 ring-blue-400'
}

function getBadge(
  game: AnyGame,
  achievementsLabel: string,
): { top: string; bottom: string } | null {
  if (isCompleted(game)) {
    const pct = (parseFloat(game.PctWon) || 0) * 100
    return {
      top: `${pct.toFixed(0)}%`,
      bottom: `${game.NumAwarded}/${game.MaxPossible}`,
    }
  }
  const achievements =
    (game as RetroAchievementsGame).AchievementsPublished ??
    (game as WantToPlayGame).AchievementsPublished
  if (achievements != null && achievements > 0) {
    return { top: `${achievements}`, bottom: achievementsLabel }
  }
  return null
}

export default function MainPageGamesList({
  listGames,
}: {
  listGames: Array<AnyGame>
}) {
  const { T } = useLanguage()

  return listGames.map((game: AnyGame, index: number) => {
    const consoleIcon = CONSOLES.find((c) => c.id === game.ConsoleID)?.icon
    const badge = getBadge(game, T.gamesList.achievements)

    return (
      <Link
        key={index}
        className="flex flex-row items-center justify-between p-2 mx-2 my-1 bg-bg-main rounded-xl w-[95%] border-2 border-bg-main cursor-pointer hover:scale-[1.02] transition-transform duration-200"
        href={`/gameInfo/${game.ID ? game.ID : game.GameID}`}
      >
        <div className="flex flex-row items-center gap-3">
          {game?.ImageIcon && (
            <Image
              src={`https://retroachievements.org${game?.ImageIcon}`}
              alt="imagen"
              width={48}
              height={48}
              className={`w-12 h-12 rounded-lg object-cover shrink-0 ${ringColor(game)}`}
            />
          )}
          <div className="flex flex-col justify-center gap-0.5">
            <p className="text-base font-medium leading-tight">
              {game?.GameTitle ? game?.GameTitle : game?.Title}
            </p>
            <div className="flex flex-row items-center gap-1">
              {consoleIcon && (
                <Image
                  src={consoleIcon}
                  alt={game.ConsoleName}
                  width={12}
                  height={12}
                  className="object-contain"
                />
              )}
              <p className="text-xs text-gray-400">{game?.ConsoleName}</p>
            </div>
          </div>
        </div>

        {badge && (
          <div className="flex flex-col items-end justify-center pr-1 shrink-0 gap-0.5">
            <span className="text-sm font-bold text-gray-300">{badge.top}</span>
            <span className="text-xs text-gray-500">{badge.bottom}</span>
          </div>
        )}
      </Link>
    )
  })
}
