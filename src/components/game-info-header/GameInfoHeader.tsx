import { RetroAchievementsGameWithAchievements } from '@/types/types'
import Image from 'next/image'
import GameInfoProgressionHeader from './game-info-header-progression/GameInfoProgressionHeader'
import { CONSOLES } from '@/constants'

export default function GameInfoHeader({
  gameData,
}: {
  gameData?: RetroAchievementsGameWithAchievements | null
}) {
  const consoleIcon = CONSOLES.find((c) => c.id === gameData?.ConsoleID)?.icon

  return (
    <section className="bg-bg-main p-5 rounded-xl min-w-[95%] grid grid-cols-[1fr_200px]">
      <div className="flex flex-row items-start gap-5">
        {gameData?.ImageIcon && (
          <Image
            src={`https://retroachievements.org${gameData?.ImageBoxArt}`}
            alt="game icon"
            width={150}
            height={150}
            className="w-50 rounded-xl"
          />
        )}
        <div className="flex flex-col flex-1 min-w-0 gap-3">
          <h1 className="text-3xl">{gameData?.Title}</h1>
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
      <div>
        <p
          className={`text-2xl ${gameData?.NumAwardedToUser == gameData?.NumAchievements ? 'bg-green-800' : 'bg-bg-card'} p-3 rounded-full text-center`}
        >
          {gameData?.NumAwardedToUser} / {gameData?.NumAchievements}
        </p>
      </div>
    </section>
  )
}
