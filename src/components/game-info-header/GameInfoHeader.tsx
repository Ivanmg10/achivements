import { RetroAchievementsGameWithAchievements } from '@/types/types'
import Image from 'next/image'
import { ReactNode } from 'react'
import GameInfoProgressionHeader from './game-info-header-progression/GameInfoProgressionHeader'
import { CONSOLES } from '@/constants'

export default function GameInfoHeader({
  gameData,
  children,
}: {
  gameData?: RetroAchievementsGameWithAchievements | null
  children?: ReactNode
}) {
  const consoleIcon = CONSOLES.find((c) => c.id === gameData?.ConsoleID)?.icon

  return (
    <section className="bg-bg-main p-5 rounded-xl min-w-[95%] grid grid-cols-1 lg:grid-cols-[1fr_400px] mt-5">
      <div className="flex flex-row items-start gap-5">
        {gameData?.ImageIcon && (
          <Image
            src={`https://retroachievements.org${gameData?.ImageBoxArt}`}
            alt="game icon"
            width={150}
            height={150}
            className="w-28 lg:w-50 rounded-xl"
          />
        )}
        <div className="flex flex-col flex-1 min-w-0 gap-3">
          <h1 className="text-2xl lg:text-3xl">{gameData?.Title}</h1>
          <div className="flex gap-2">
            {consoleIcon && gameData?.ConsoleName && (
              <Image
                src={consoleIcon}
                alt={gameData?.ConsoleName}
                width={16}
                height={16}
                className="object-contain"
              />
            )}
            <p className="text-lg">{gameData?.ConsoleName}</p>
          </div>
          <GameInfoProgressionHeader gameData={gameData} />
          {children}
          <ul className="flex flex-col gap-1 text-sm">
            <li>
              <span className="text-text-secondary">ID: </span>
              {gameData?.ID}
            </li>
            <li>
              <span className="text-text-secondary">Publisher: </span>
              {gameData?.Publisher ?? '—'}
            </li>
            <li>
              <span className="text-text-secondary">Developer: </span>
              {gameData?.Developer ?? '—'}
            </li>
            <li>
              <span className="text-text-secondary">Genre: </span>
              {gameData?.Genre ?? '—'}
            </li>
            <li>
              <span className="text-text-secondary">Released: </span>
              {gameData?.Released ?? '—'}
            </li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col items-center lg:items-end gap-4 lg:justify-between mt-4 lg:mt-0">
        <p
          className={`text-2xl ${gameData?.NumAwardedToUser == gameData?.NumAchievements ? 'bg-green-800' : 'bg-bg-card'} px-5 py-3 rounded-full text-center whitespace-nowrap`}
        >
          {gameData?.NumAwardedToUser} / {gameData?.NumAchievements}
        </p>

        {(gameData?.ImageTitle || gameData?.ImageIngame) && (
          <div className="grid grid-cols-2 gap-2 w-full max-w-sm lg:max-w-none">
            {gameData.ImageTitle && (
              <div className="flex flex-col gap-0.5">
                <Image
                  src={`https://retroachievements.org${gameData.ImageTitle}`}
                  alt="Title screen"
                  width={200}
                  height={150}
                  className="w-full rounded-md object-cover aspect-4/3"
                />
                <span className="text-[10px] text-text-secondary text-center">Title Screen</span>
              </div>
            )}
            {gameData.ImageIngame && (
              <div className="flex flex-col gap-0.5">
                <Image
                  src={`https://retroachievements.org${gameData.ImageIngame}`}
                  alt="In game screenshot"
                  width={200}
                  height={150}
                  className="w-full rounded-md object-cover aspect-4/3"
                />
                <span className="text-[10px] text-text-secondary text-center">In Game</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
