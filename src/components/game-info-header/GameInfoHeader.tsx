'use client'

import { RetroAchievementsGameWithAchievements } from '@/types/types'
import Image from 'next/image'
import { ReactNode, useState } from 'react'
import GameInfoProgressionHeader from './game-info-header-progression/GameInfoProgressionHeader'
import GameHashesModal from './GameHashesModal'
import { CONSOLES } from '@/constants'
import { IconHash, IconExternalLink } from '@tabler/icons-react'

export default function GameInfoHeader({
  gameData,
  children,
}: {
  gameData?: RetroAchievementsGameWithAchievements | null
  children?: ReactNode
}) {
  const consoleIcon = CONSOLES.find((c) => c.id === gameData?.ConsoleID)?.icon
  const [hashesOpen, setHashesOpen] = useState(false)

  const bgImage = gameData?.ImageTitle ?? gameData?.ImageIngame ?? null

  return (
    <section className="relative bg-bg-card p-5 rounded-xl min-w-[95%] grid grid-cols-1 lg:grid-cols-[1fr_400px] mt-5 overflow-hidden">
      {/* Blurred background */}
      {bgImage && (
        <>
          <div
            className="absolute inset-0 scale-110"
            style={{
              backgroundImage: `url(https://retroachievements.org${bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(12px)',
              opacity: 0.8,
            }}
          />
          <div className="absolute inset-0 bg-bg-main/60" />
        </>
      )}

      {/* Content — above background layers */}
      <div className="relative z-10 flex flex-row items-start gap-5">
        {gameData?.ImageBoxArt && (
          <Image
            src={`https://retroachievements.org${gameData.ImageBoxArt}`}
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
          {gameData?.ID && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setHashesOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-text-secondary hover:text-text-main text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-accent/70"
              >
                <IconHash className="w-3.5 h-3.5" />
                Hashes compatibles
              </button>
              <a
                href={`https://retroachievements.org/game/${gameData.ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-text-secondary hover:text-text-main text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-accent/70"
              >
                <IconExternalLink className="w-3.5 h-3.5" />
                RetroAchievements
              </a>
            </div>
          )}
        </div>
      </div>
      <div className="relative z-10 flex flex-col items-center lg:items-end gap-4 lg:justify-between mt-4 lg:mt-0">
        <p
          className={`hidden lg:block text-2xl ${gameData?.NumAwardedToUser == gameData?.NumAchievements ? 'bg-green-800' : 'bg-bg-card'} px-5 py-3 rounded-full text-center whitespace-nowrap`}
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

      {gameData?.ID && (
        <GameHashesModal
          isOpen={hashesOpen}
          onClose={() => setHashesOpen(false)}
          gameId={gameData.ID}
          gameTitle={gameData.Title ?? ''}
        />
      )}
    </section>
  )
}
