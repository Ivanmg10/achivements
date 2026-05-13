'use client'

import { RetroAchievementsGameWithAchievements } from '@/types/types'
import Image from 'next/image'
import { ReactNode, useState } from 'react'
import GameInfoProgressionHeader from './game-info-header-progression/GameInfoProgressionHeader'
import GameHashesModal from './GameHashesModal'
import { CONSOLES } from '@/constants'
import { IconHash, IconExternalLink } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

type StatusKey = 'mastered' | 'completed' | 'beatenHC' | 'beaten' | 'inProgress'

const STATUS_CLASSES: Record<StatusKey, string> = {
  mastered: 'bg-warning/20 text-warning',
  completed: 'bg-success/20 text-success',
  beatenHC: 'bg-warning/15 text-warning',
  beaten: 'bg-success/15 text-success',
  inProgress: 'bg-info/20 text-info',
}

function deriveStatus(gameData: RetroAchievementsGameWithAchievements): StatusKey | null {
  const kind = gameData.HighestAwardKind
  if (kind === 'mastered') return 'mastered'
  if (kind === 'completed') return 'completed'
  if (kind === 'beaten-hardcore') return 'beatenHC'
  if (kind === 'beaten-softcore') return 'beaten'
  if ((gameData.NumAwardedToUser ?? 0) > 0) return 'inProgress'
  return null
}

export default function GameInfoHeader({
  gameData,
  children,
}: {
  gameData?: RetroAchievementsGameWithAchievements | null
  children?: ReactNode
}) {
  const { T } = useLanguage()
  const consoleDef = CONSOLES.find((c) => c.id === gameData?.ConsoleID)
  const consoleIcon = consoleDef?.icon
  const consoleColor = consoleDef?.color
  const [hashesOpen, setHashesOpen] = useState(false)

  const bgImage = gameData?.ImageTitle ?? gameData?.ImageIngame ?? null
  const status = gameData ? deriveStatus(gameData) : null

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

          {/* Console + status row */}
          <div className="flex items-center gap-2 flex-wrap">
            {gameData?.ConsoleName && (
              <span className={`inline-flex items-center gap-1.5 text-sm px-2 py-0.5 rounded-md font-medium ${consoleColor ?? 'text-text-secondary'}`}>
                {consoleIcon && (
                  <Image
                    src={consoleIcon}
                    alt={gameData.ConsoleName}
                    width={14}
                    height={14}
                    className="object-contain shrink-0"
                  />
                )}
                {gameData.ConsoleName}
              </span>
            )}
            {status && (
              <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-md font-medium ${STATUS_CLASSES[status]}`}>
                {T.gameStatus[status]}
              </span>
            )}
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
          className={`hidden lg:block text-2xl ${gameData?.NumAwardedToUser == gameData?.NumAchievements ? 'bg-success/20 text-success' : 'bg-bg-card'} px-5 py-3 rounded-full text-center whitespace-nowrap`}
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
